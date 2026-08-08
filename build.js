const fs = require('fs');
const path = require('path');

// المتغير الوحيد المطلوب إجباريًا
const REQUIRED = ['SECRETPASS'];

// باقي المتغيرات اختيارية - لو أي واحد فاضي، الكود جوه index.html
// عنده قيمة افتراضية (صورة placeholder أو رابط موسيقى افتراضي) فالموقع يشتغل عادي
const OPTIONAL = [
    'PHOTO_URLSPHOTO1',
    'PHOTO_URLSPHOTO2',
    'PHOTO_URLSPHOTO3',
    'PHOTO_URLSPHOTO4',
    'PHOTO_URLSPHOTO5',
    'PHOTO_URLSPHOTO6',
    'MUSICURL'
];

const secrets = {};
[...REQUIRED, ...OPTIONAL].forEach(key => {
    secrets[key] = process.env[key] || '';
});

// ===================================================================
// فحص صارم: لو أي secret مطلوب فاضي، نوقف الـ build فورًا بخطأ واضح
// (بدل ما ننجح بصمت بقيمة فاضية زي ما كان بيحصل قبل كده)
// ===================================================================
const missing = REQUIRED.filter(key => !secrets[key] || secrets[key].trim() === '');

if (missing.length > 0) {
    console.error('❌ فشل البناء! الـ Secrets الآتية مش موجودة أو فاضية في GitHub:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('');
    console.error('روح Settings → Secrets and variables → Actions وتأكد إنها كلها موجودة بنفس الاسم بالظبط.');
    process.exit(1); // إيقاف الـ workflow بالكامل بفشل واضح
}

console.log('✅ كل الـ Secrets المطلوبة موجودة، جاري البناء...');

// قراءة ملف HTML الأصلي
let htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// استبدال جميع المتغيرات
for (const [key, value] of Object.entries(secrets)) {
    const placeholder = `{{ ${key} }}`;
    const occurrences = htmlContent.split(placeholder).length - 1;
    if (occurrences === 0) {
        console.warn(`⚠️ تحذير: الـ placeholder {{ ${key} }} مش موجود في index.html أصلاً`);
    }
    htmlContent = htmlContent.split(placeholder).join(value);
    console.log(`✅ استبدال ${key} (${occurrences} مكان)`);
}

// تأكيد نهائي: لو لسه فيه أي {{ }} متبقي، يبقى فيه مشكلة
const leftover = htmlContent.match(/\{\{\s*[A-Z0-9_]+\s*\}\}/g);
if (leftover) {
    console.error('❌ فشل البناء! لسه فيه placeholders متبقية في الملف النهائي:', leftover);
    process.exit(1);
}

// حفظ الملف النهائي
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), htmlContent);

// نسخ ملف الموسيقى المحلي (لو موجود) لمجلد dist عشان ينشر مع الموقع
const musicSrc = path.join(__dirname, 'm.mp3');
if (fs.existsSync(musicSrc)) {
    fs.copyFileSync(musicSrc, path.join(__dirname, 'dist', 'm.mp3'));
    console.log('✅ تم نسخ m.mp3 إلى dist');
} else {
    console.log('⚠️ ملف m.mp3 غير موجود في جذر المشروع - هيتم استخدام رابط افتراضي أونلاين لو موجود، وإلا الموسيقى مش هتشتغل');
}

console.log('🎉 تم بناء الموقع بنجاح!');
