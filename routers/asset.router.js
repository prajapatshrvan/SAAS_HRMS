const asset = require("../controllers/assetController");
const { auth } = require("../middleware/AuthMiddleware");
const router = require("express").Router();

router.post("/addasset", auth, asset.addAsset);
router.post("/updateasset", auth, asset.UpdateAsset);
router.get("/assetlist", auth, asset.getAsset);
router.post("/assectassign", auth, asset.Assetassign);
router.get("/assetassignlist", auth, asset.AssetAssignList);
router.get("/pendingasset", auth, asset.PendingAsset);
router.post("/status", auth, asset.AssetAssignList);
router.post("/verify", auth, asset.Verified);
router.post("/verifyall", auth, asset.VerifiedAll);
router.post("/bulkasset", auth, asset.bulkAssetUpload);
router.get("/getasset/:id", auth, asset.getAssetByID);
router.get("/invantory", auth, asset.invantory);
router.post("/revokeasset", auth, asset.RevokeAsset);
module.exports = router;
