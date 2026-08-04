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
router.post("/personnel/search", auth_sign.authenticateSignToken.verify_mid, personnelControl.searchPersonnel);

// sec2 > sec3
router.post("/personnel/insert", auth_sign.authenticateSignToken.verify_mid, personnelControl.insertPersonnel);
// put api
router.put("/personnel/update", auth_sign.authenticateSignToken.verify_mid, personnelControl.updatePersonnel);

// delete api
router.delete("/personnel/delete/:id", auth_sign.authenticateSignToken.verify_mid, personnelControl.deletePersonnel);

// get faculties list for dropdown
router.get("/personnel/faculties", personnelControl.getFaculties);

// get prenames list for dropdown
router.get("/personnel/prenames", personnelControl.getPrenames);

// get person types list for dropdown
router.get("/personnel/persontypes", personnelControl.getPersonTypes);

// get fund types list for dropdown
router.get("/personnel/fundtypes", personnelControl.getFundTypes);

// get project types list for dropdown
router.get("/personnel/projecttypes", personnelControl.getProjectTypes);

// get source money list for dropdown
router.get("/personnel/sourcemoney", personnelControl.getSourceMoneyTypes);

module.exports = router;
