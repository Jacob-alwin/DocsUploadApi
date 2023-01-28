import { Router } from "express";
import firebase from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { uuidv4 } from "@firebase/util";
import formidable from "formidable-serverless";
import credential from "./credential.json" assert { type: "json" };

const COLLECTION = "Users";
const FOLDER_NAME = "Users";
const BUCKET_NAME = "game-docs.appspot.com";

// Initialize Firebase
const app = firebase.initializeApp({
  credential: firebase.credential.cert(credential),
  storageBucket: `${BUCKET_NAME}`,
});

const documentRef = firebase.firestore(app).collection(COLLECTION);

const router = Router();

const storage = getStorage();

router.patch("/", async (req, res) => {
  const form = new formidable.IncomingForm({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      const { type, uid } = fields;
      if (
        err ||
        files.image.size <= 0 ||
        !type ||
        !["AADHAAR_FRONT", "AADHAAR_BACK", "PAN", "SELFI"].includes(
          type.trim()
        ) ||
        !uid
      )
        throw new Error(
          err
            ? err.message
            : "Provide image, type (AADHAAR_FRONT,AADHAAR_BACK,PAN,SELFI) and uid"
        );

      const document = (await documentRef.doc(uid).get()).data();

      if (!document) throw new Error("User not found");

      const documentToken = uuidv4();
      const documentImage = files.image;

      const bucket = storage.bucket(BUCKET_NAME);
      const imageResponse = await bucket.upload(documentImage.path, {
        destination: `${FOLDER_NAME}/${uuidv4()}-${documentImage.name}`,
        resumable: true,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: documentToken,
          },
        },
      });

      const imageUrl =
        `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/` +
        encodeURIComponent(imageResponse[0].name) +
        "?alt=media&token=" +
        documentToken;

      switch (type.trim()) {
        case "AADHAAR_FRONT": {
          await documentRef.doc(uid).update({
            AdharUrl: imageUrl,
          });
          break;
        }
        case "AADHAAR_BACK": {
          await documentRef.doc(uid).update({
            AdharBackUrl: imageUrl,
          });
          break;
        }
        case "PAN": {
          await documentRef.doc(uid).update({
            pancardUrl: imageUrl,
          });
          break;
        }
        case "SELFI": {
          await documentRef.doc(uid).update({
            selfiUrl: imageUrl,
          });
          break;
        }
        default:
          break;
      }

      res.status(200).send({
        success: true,
        message: "Document uploaded successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  });
});

export default router;
