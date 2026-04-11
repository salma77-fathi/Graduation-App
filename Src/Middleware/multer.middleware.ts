import multer from "multer";
import fs from "node:fs";

function checkCreateFolder(folder: string) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

export const localUpload = ({ folder = "activate" }) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const fileDir = `Uploads/${folder}`;
      checkCreateFolder("Uploads");
      checkCreateFolder(fileDir);
      cb(null, fileDir);
    },
    filename: function (req, file, cb) {
      console.log({ file });
      const uniqueName = file.originalname;
      cb(null, uniqueName);
    },
  });
  return multer({ storage });
};
