const DocumnetAddress = require("../controllers/documnetaddController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/add/documnet/address", auth, DocumnetAddress.AddDocumentAddress);
router.post("/update/documnet/address", auth, DocumnetAddress.UpdateDocAddress);
router.post("/delete/document", auth, DocumnetAddress.deleteDocAddress);
router.get("/document/address/list", auth, DocumnetAddress.documnetAddressList);

module.exports = router;
