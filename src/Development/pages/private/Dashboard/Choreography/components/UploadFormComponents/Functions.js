// import { API } from "../../../../../../Context/ContextProvider";
import { useContext } from "react";
import Context from '../../../../../../Context/Context.jsx'

const CHUNK_SIZE = 5 * 1024 * 1024;

export const useUploadFunctions = () => {
  const { userData, manageClassVideoUpload } = useContext(Context);

  const uploadFunctions = {
    // Upload thumbnail to S3
    uploadThumbnail: async (thumbnailFile) => {
      try {
        const thumbnailResponse = await manageClassVideoUpload(userData.institution, {
          operation: "GET_THUMBNAIL_URL",
          fileName: thumbnailFile.name,
          contentType: thumbnailFile.type,
        });

        if (!thumbnailResponse.presignedUrl || !thumbnailResponse.key) {
          throw new Error("Invalid response for thumbnail upload URL");
        }

        const uploadResponse = await fetch(thumbnailResponse.presignedUrl, {
          method: "PUT",
          body: thumbnailFile,
          headers: {
            "Content-Type": thumbnailFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Thumbnail upload failed");
        }

        // Use the presigned URL (without query params) as the canonical public URL
        const presigned = thumbnailResponse.presignedUrl;
        const canonicalUrl = presigned.split("?")[0];

        return { key: thumbnailResponse.key, url: canonicalUrl };
      } catch (error) {
        console.error("Thumbnail upload error:", error);
        throw new Error(`Failed to upload thumbnail: ${error.message}`);
      }
    },

    // Initiate multipart upload
    initiateMultipartUpload: async (videoDetails) => {
      try {
        const response = await manageClassVideoUpload(userData.institution, {
          operation: "INITIATE_UPLOAD",
          ...videoDetails,
        });

        if (!response.uploadId || !response.key) {
          throw new Error("Invalid response from initiate upload");
        }

        return { uploadId: response.uploadId, key: response.key };
      } catch (error) {
        console.error("Initiate upload error:", error);
        throw new Error(`Failed to initiate multipart upload: ${error.message}`);
      }
    },

    // Upload individual chunk
    uploadChunk: async (chunk, partNumber, uploadId, key) => {
      try {
        // Get the upload URL
        const urlResponse = await manageClassVideoUpload(userData.institution, {
          operation: "GET_UPLOAD_URL",
          uploadId,
          partNumber,
          key,
        });

        if (!urlResponse.presignedUrl) {
          throw new Error("No presigned URL received");
        }

        // Add debugging
        console.log(`Uploading part ${partNumber} with content length: ${chunk.size}`);

        // Make sure to use exact same content-type that was used to generate the signature
        const uploadResponse = await fetch(urlResponse.presignedUrl, {
          method: "PUT",
          body: chunk,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });

        if (!uploadResponse.ok) {
          // Enhanced error handling
          const errorText = await uploadResponse.text();
          console.error(`Upload failed for part ${partNumber}:`, {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorText,
            headers: Object.fromEntries(uploadResponse.headers),
          });
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        // Get ETag from response headers
        const eTag = uploadResponse.headers.get("etag") ||
          uploadResponse.headers.get("ETag") ||
          uploadResponse.headers.get("Etag");

        if (!eTag) {
          throw new Error(`No ETag received for part ${partNumber}`);
        }

        // Return the part information
        return {
          PartNumber: partNumber,
          ETag: eTag.replace(/^["']|["']$/g, ""), // Remove quotes if present
        };
      } catch (error) {
        console.error(`Error uploading part ${partNumber}:`, error);
        throw new Error(`Failed to upload part ${partNumber}: ${error.message}`);
      }
    },

    // Complete multipart upload
    completeMultipartUpload: async (uploadId, parts, key) => {
      try {
        if (!parts || parts.length === 0) {
          throw new Error("No parts provided for completion");
        }

        const response = await manageClassVideoUpload(userData.institution, {
          operation: "COMPLETE_UPLOAD",
          uploadId,
          parts,
          key,
        });

        if (!response || !response.videoUrl) {
          throw new Error("Invalid response from complete upload");
        }

        return response;
      } catch (error) {
        console.error("Complete upload error:", error);
        throw new Error(`Failed to complete multipart upload: ${error.message}`);
      }
    },

    // Update metadata in DynamoDB
    updateMetadata: async (metadata) => {
      try {
        await manageClassVideoUpload(userData.institution, {
          operation: "UPDATE_METADATA",
          ...metadata,
        });
      } catch (error) {
        console.error("Update metadata error:", error);
        throw new Error(`Failed to update metadata: ${error.message}`);
      }
    },

    // Handle the complete upload process
    handleCompleteUpload: async (formData, setUploadProgress) => {
      console.log("hello")
      try {
        // Upload thumbnail
        const thumbnailKeyOrObj = await uploadFunctions.uploadThumbnail(
          formData.thumbnail
        );

        // Initiate multipart upload
        const { uploadId, key } = await uploadFunctions.initiateMultipartUpload({
          videoType: formData.videoType,
          partNo: formData.partNo,
          songName: formData.songName,
          title: formData.title,
          choreographer: formData.choreographer,
          playlist: formData.playlist,
          contentType: formData.video.type,
          fileName: formData.video.name,
        });

        // Upload chunks
        const chunks = Math.ceil(formData.video.size / CHUNK_SIZE);
        const uploadedParts = [];

        for (let i = 0; i < chunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, formData.video.size);
          const chunk = formData.video.slice(start, end);

          const part = await uploadFunctions.uploadChunk(
            chunk,
            i + 1,
            uploadId,
            key
          );
          uploadedParts.push(part);
          setUploadProgress(((i + 1) / chunks) * 100);
        }

        // Complete multipart upload
        const completionResponse = await uploadFunctions.completeMultipartUpload(
          uploadId,
          uploadedParts,
          key
        );

        // Update metadata
        const { key: thumbnailKey, url: thumbnailUrlFromServer } = thumbnailKeyOrObj || {};
        const thumbnailUrl =
          thumbnailUrlFromServer ||
          `https://${process.env.REACT_APP_CLASS_VIDEOS_BUCKET}.s3.amazonaws.com/${thumbnailKey}`;
        const videoUrl = completionResponse.videoUrl;

        await uploadFunctions.updateMetadata({
          videoType: formData.videoType,
          partNo: formData.partNo,
          songName: formData.songName,
          title: formData.title,
          choreographer: formData.choreographer,
          playlist: formData.playlist,
          videoUrl: videoUrl,
          thumbnailUrl: thumbnailUrl,
        });

        // Return success status and data
        return {
          success: true,
          data: {
            videoType_partNo: `${formData.videoType}_${formData.partNo}`,
            songName: formData.songName,
            title: formData.title,
            choreographer: formData.choreographer,
            playlist: formData.playlist,
            videoUrl: videoUrl,
            thumbnailUrl: thumbnailUrl,
            uploadDate: Date.now(), // Add current date if needed for "time ago" functionality
          },
        };
      } catch (error) {
        console.error("Error during complete upload process:", error);
        throw error;
      }
    },
  };

  return uploadFunctions;
};

export default useUploadFunctions;