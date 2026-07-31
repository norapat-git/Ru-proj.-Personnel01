const Response = require("../../models/response/Response");
const Helper = require('../../utils/Helper');
require("dotenv").config();


class authenticateSignToken {
    static async sign_mid(req, res, next) {
        try {
            // if (!req.headers["authorization"]) return res.sendStatus(401)

            // const secrete_id = req.headers["authorization"].replace("Bearer ", "")
            //console.log(secrete_id);

            //const { client_id, secrete_id } = req.body;
            const { PER_CITIZEN_ID } = req.body;
            if (!PER_CITIZEN_ID) {
                //return res.status(401).json({ success: false, message: "Unauthorized Access" })
                return res.status(400).json({ success: false, message: "กรุณาระบุ PER_CITIZEN_ID" });
            }

            const token = await Helper.authJWTAccessToken(PER_CITIZEN_ID, process.env.secrete_id);
            // res.json({ success: true, refresh_token: token });
            if (token) {
                return res.status(200).json({ success: true, token: token });
            } else {
                return res.status(401).json({ success: false, message: "ไม่สามารถสร้าง Token ได้" });
            }
        } catch (err) {
            // res.status(200).json({ success: false, message: "Unauthorized Access" });
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    static verify_mid(req, res, next) {
        const authHeader = req.headers["authorization"];

        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.replace("Bearer ", "");

            if (!token) {
                return res.status(401).json({ success: false, message: "Unauthorized Access. Token is empty." });
            }

            try {
                const decoded = Helper.verifyJWTtoken(process.env.secrete_id, token);
                req.decoded = decoded; 
                next(); 
            } catch (err) {
                return res.status(401).json({ success: false, message: "Authorized Expire." });
            }
        } else {
            return res.status(401).json({ success: false, message: "Unauthorized Access. Missing Bearer Token." });
        }
    }
}


module.exports = { authenticateSignToken }

