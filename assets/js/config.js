/* ============================================================
   إعدادات الربط — المنصة الإلكترونية لخدمات الهيئات الدبلوماسية
   ------------------------------------------------------------
   • إذا تركت apiKey فاضي: المنصة تشتغل في "الوضع التجريبي المحلي"
     (تُحفظ البيانات في المتصفح نفسه، ويمكن فتح المنصتين في تبويبين للتجربة).
   • إذا عبّيت بيانات Firebase: المنصتين ينربطون ببعض من أي جهاز.
   الخطوات بالتفصيل في ملف: دليل الربط مع Firebase.html
   ============================================================ */

window.APP_CONFIG = {

  // انسخ هني بيانات مشروعك من Firebase Console → Project settings → Your apps → Config
  firebase: {
    apiKey: "AIzaSyCvVMt81v3GyCxn_L_LBMeflJXM9FOr_rc",
    authDomain: "dip-platform-pilot.firebaseapp.com",
    projectId: "dip-platform-pilot",
    storageBucket: "dip-platform-pilot.firebasestorage.app",
    messagingSenderId: "535050711885",
    appId: "1:535050711885:web:b98ec95bef5502083b3d04"
  },

  // false = الدخول باختيار البعثة / اسم الموظف (تشغيل تجريبي)
  // true  = الدخول بالبريد وكلمة المرور (تحتاج تنشئ الحسابات في Firebase → Authentication)
  useEmailLogin: false,

  // حسابات الهيئات الدبلوماسية (تُستخدم فقط إذا useEmailLogin = true) (البريد في Firebase ← رمز البعثة)
  embassyAccounts: {
    "alpha@pilot.test": "m1",
    "beta@pilot.test":  "m2",
    "gamma@pilot.test": "m3",
    "delta@pilot.test": "m4"
  },

  // حسابات موظفي شرطة دبي المسموح لهم بدخول لوحة الاستلام
  policeAccounts: [
    "ops@pilot.test"
  ]
};
