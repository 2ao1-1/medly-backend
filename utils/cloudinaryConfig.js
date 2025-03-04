import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// ✅ تهيئة Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ إعداد تخزين الصور الشخصية للمستخدمين
const userStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "medly_users",
    allowed_formats: ["jpeg", "jpg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

// ✅ إعداد تخزين ملفات الأطباء (صور + PDF)
const doctorStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "medly_documents",
    allowed_formats: ["jpeg", "jpg", "png", "pdf"], // ✅ دعم رفع PDF
  },
});

// ✅ تهيئة `multer` لكل نوع من الملفات
const uploadUserAvatar = multer({ storage: userStorage }); // لصور المستخدمين
const uploadDoctorDocuments = multer({ storage: doctorStorage }); // للوثائق الطبية

// ✅ رفع الملفات برمجيًا إلى Cloudinary بدون `multer`
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath);
    return result.secure_url; // إرجاع رابط الملف المرفوع
  } catch (error) {
    throw new Error("Cloudinary upload failed");
  }
};

// ✅ تصدير الوظائف المستخدمة في الـ API
export {
  uploadUserAvatar,
  uploadDoctorDocuments,
  uploadToCloudinary,
  cloudinary as default,
};
