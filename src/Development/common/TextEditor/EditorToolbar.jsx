// EditorToolbar.jsx
const EditorToolbar = (folders) => ({
  container: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: [] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [
      "link",
      ...(folders !== "" ? ["image"] : []),
      ...(folders !== "" ? ["video"] : []),
    ].filter(Boolean),
    [{ blockquote: true }],
    ["clean"],
  ],
});

export default EditorToolbar;
