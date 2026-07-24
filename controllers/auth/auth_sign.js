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
            const { STD_CODE } = req.body;
            if (!STD_CODE) {
                //return res.status(401).json({ success: false, message: "Unauthorized Access" })
                return null;
            }

            const token = await Helper.authJWTAccessToken(STD_CODE, process.env.secrete_id);
            // res.json({ success: true, refresh_token: token });
            return token;
        } catch (err) {
            return null;
            // res.status(200).json({ success: false, message: "Unauthorized Access" });
        }
    }

    static verify_mid(req, res, next) {
        const { token } = req.body;

        // console.log(token);
        if (typeof token !== 'undefined') {
            if (!token) {
                return res.status(200).json({ success: false, message: "Unauthorized Access." });
            }

            try {
                const decoded = Helper.verifyJWTtoken(process.env.secrete_id, token); // Use different variable name
                req.decoded = decoded; // Optionally attach to request for downstream use
                next(); // Proceed to the next middleware or route 
            } catch (err) {
                res.status(200).json({ success: false, message: "Authorized Expire." });
            }
        } else {
            res.status(200).json({ success: false, message: "Unauthorized Access" })
        }
    }
}


module.exports = { authenticateSignToken }

//hello