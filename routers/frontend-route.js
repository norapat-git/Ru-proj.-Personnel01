var express = require("express");

const router = express.Router();

// -------------------------------------
const auth_sign = require("../controllers/auth/auth_sign");
const _system = require("../controllers/frontend/exam1");
const personnelControl = require("../controllers/personnelControl");

// ------------ authentication --------------------
router.post("/sign", auth_sign.authenticateSignToken.sign_mid);
router.post("/verify", auth_sign.authenticateSignToken.verify_mid);
//-------------------------------------------------

// ------------- exam1 ------------------
router.post(
  "/counter_control1",
  auth_sign.authenticateSignToken.verify_mid,
  _system.exam1,
);
router.post("/counter_control2", _system.exam1);

// ------------- (Personnel API) ------------------

// sec1 > sec2
router.get("/personnel/search", personnelControl.searchPersonnel);

// sec2 > sec3
router.post("/personnel/insert", personnelControl.insertPersonnel);
// put api
router.put("/personnel/update", personnelControl.updatePersonnel);

// delete api
router.delete("/personnel/delete/:id", personnelControl.deletePersonnel);

// get faculties list for dropdown
router.get("/personnel/faculties", personnelControl.getFaculties);

module.exports = router;
