# اختبار Lord of the Flies على Google

هذا المجلد يحوّل الاختبار إلى موقع عام على Google باستخدام Google Apps Script:

- يفتح على الآيفون والأندرويد من أي متصفح، ولا يحتاج الزائر إلى تسجيل دخول.
- يحسب كل شخص يدخل الموقع، ويسجل الزيارات في جدول Google Sheets.
- يرسل كل يوم بين الساعة 8 و9 مساءً بتوقيت بغداد رسالة إلى alanyy61@gmail.com فيها عدد الزوار.

## الملفات

- `Index.html`: صفحة الاختبار (89 سؤالاً، باللغة الإنجليزية فقط).
- `Code.gs`: الكود الذي يعرض الصفحة ويحسب الزوار ويرسل البريد.
- `appsscript.json`: إعدادات المشروع (توقيت بغداد، والموقع مفتوح للجميع).
- `CLAUDE.md`: تعليمات يقرؤها Claude Code.

## الطريقة الأولى: عبر Claude Code على الكمبيوتر

1. فك ضغط الملف على الكمبيوتر، وافتح المجلد `lotf-quiz-google` في Claude Code.
2. الصق هذا الطلب:

   ```
   Read CLAUDE.md and deploy this Google Apps Script web app with clasp. Explain each step to me in Arabic, tell me whenever I need to sign in or approve something, and give me the final site URL.
   ```

3. هناك ثلاثة أشياء ستفعلها أنت بنفسك عندما يطلبها منك Claude Code:
   - تشغيل Google Apps Script API من الرابط: https://script.google.com/home/usersettings
   - تسجيل الدخول بحسابك في Google.
   - تشغيل الدالة `setup` مرة واحدة من محرر Apps Script، ثم الموافقة على الأذونات.

## الطريقة الثانية: بدون Claude Code (حوالي 5 دقائق على الكمبيوتر)

1. افتح https://script.google.com واضغط **New project**.
2. احذف كل ما في ملف `Code.gs`، ثم الصق محتوى ملف `Code.gs` من هذا المجلد.
3. اضغط **+** بجانب **Files**، واختر **HTML**، وسمّ الملف `Index`، ثم الصق فيه محتوى `Index.html`.
4. افتح **Project Settings** (رمز الترس)، واختر المنطقة الزمنية **(GMT+03:00) Baghdad**.
5. ارجع إلى المحرر، واختر الدالة `setup` من القائمة في الأعلى، واضغط **Run**، ثم وافق على الأذونات.
   - إذا ظهرت رسالة "Google hasn't verified this app" فاضغط **Advanced**، ثم **Go to ... (unsafe)**، ثم **Allow**.
   - ستصلك رسالة تأكيد على alanyy61@gmail.com.
6. اضغط **Deploy** ثم **New deployment**، واختر النوع **Web app**، واضبط الخيارات هكذا:
   - **Execute as**: Me
   - **Who has access**: Anyone

   ثم اضغط **Deploy** وانسخ رابط **Web app**. هذا هو رابط موقعك، أرسله للطلاب.

## ملاحظات

- يُحسب الشخص مرة واحدة لكل جهاز ومتصفح. إذا رجع إلى الموقع تُحسب له زيارة جديدة، لكنه لا يُحسب شخصاً جديداً.
- لترى كل الزيارات افتح جدول **Lord of the Flies Quiz - Visitors** في Google Drive، ورابطه موجود أيضاً في كل رسالة.
- لتغيير وقت الرسالة: غيّر الرقم `REPORT_HOUR` في `Code.gs`، ثم شغّل `setup` مرة أخرى.
- لإرسال التقرير فوراً: شغّل الدالة `sendReportNow`.
- إذا عدّلت الملفات بعد النشر: اضغط **Deploy** ثم **Manage deployments**، وعدّل النشر الحالي واختر **New version**. بهذا يبقى الرابط كما هو.
