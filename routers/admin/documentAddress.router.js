const DocumnetAddress = require("../../controllers/admin/documnetaddController");
const { auth } = require("../../middleware/AdminauthMiddleware");
const router = require("express").Router();

router.post("/add/documnet/address", auth, DocumnetAddress.AddDocumentAddress);
router.put("/update/documnet/address/:id", auth, DocumnetAddress.UpdateDocAddress);
router.delete("/delete/document/:id", auth, DocumnetAddress.deleteDocAddress);
router.get("/document/address/list", auth, DocumnetAddress.documentAddressList);

module.exports = router;
