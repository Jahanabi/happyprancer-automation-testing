// constants.js
import data from '../Operation/data.json';
import metaTags from '../Operation/metatags.json';

const { institutionId } = data;
function splitInstitutionId() {
    const parts = institutionId.split(/(\d+)/).filter(Boolean);
    return {
        institution: parts[0],
        id: parts[1]
    };
}

const result = splitInstitutionId();
const institutionName = result.institution;

const institutionData = {
    BETA_DOMAIN: data.domain,
    PROD_DOMAIN: data.domain,
    InstitutionId: data.institutionId,
    institution: institutionName,
    institutionType: 'ds',
    GTM_ID: metaTags.gtmId,
    timezone: data.timezone || null,
    scheduleTimezone: data.scheduleTimezone || null,
    deployment: {
        [`beta-${institutionId}`]: {
            s3Bucket: data.s3BucketName,
            cloudfrontId: data.cloudFrontId
        },
        [institutionId]: {
            s3Bucket:data.s3BucketName,
            cloudfrontId: data.cloudFrontId
        }
    },
    seo: {
        title: metaTags.seo.title,
        description: metaTags.seo.description,
        keywords: metaTags.seo.keywords
    }
};

export default institutionData;