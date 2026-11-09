/* =========================================================
   التعاميم الأمنية وطلبات الطمأنة — نصوص بعشر لغات وقوالب جاهزة
   ========================================================= */
(function () {
  const L = {
    ar: {
      ui: { ack: "تم الاطلاع", sec: "تعاميم شرطة دبي", chkT: "شرطة دبي تطمئن عليكم", chkSub: "يرجى تأكيد حالة البعثة ومنسوبيها", safe: "نحن بخير", help: "نحتاج مساعدة",
        note: "ملاحظة (اختياري)", sentSafe: "تم إرسال ردكم: البعثة بخير", sentHelp: "تم إرسال طلب المساعدة، وستتواصل معكم غرفة العمليات", none: "لا توجد تعاميم حالياً",
        newAdv: "تعميم جديد من شرطة دبي", newChk: "شرطة دبي تطمئن عليكم — يرجى الرد", sentAt: "أُرسل", from: "من", to: "إلى", areaL: "المنطقة", dateL: "التاريخ", untilL: "حتى" },
      reason: { weather: "بسبب الحالة الجوية", incident: "إثر حادث أمني", event: "خلال فعالية كبرى", drill: "تمرين لاختبار جاهزية التواصل", general: "" },
      title: { roads: "إغلاق طرق", weather: "تنبيه جوي", event: "فعالية كبرى", alert: "رفع مستوى الحيطة", custom: "تعميم" },
      opt: { event: "بسبب فعالية عامة", celebration: "بسبب احتفالات", works: "بسبب أعمال طرق", rain: "هطول أمطار غزيرة", wind: "رياح نشطة مثيرة للغبار", fog: "تشكّل ضباب كثيف" },
      tpl: {
        roads: p => `تُغلق بعض الطرق في منطقة ${p.area} يوم ${p.date} من الساعة ${p.tfrom} إلى الساعة ${p.tto} ${p.opt}. يُرجى مراعاة ذلك في تنقلات منسوبي البعثة وضيوفها، واختيار طرق بديلة.`,
        weather: p => `تشير التوقعات إلى ${p.opt} في دبي يوم ${p.date}. يُرجى الحد من التنقلات غير الضرورية، والتأكد من جاهزية إجراءات السلامة في مقر البعثة.`,
        event: p => `تُقام فعالية كبرى في منطقة ${p.area} يوم ${p.date} من الساعة ${p.tfrom} إلى الساعة ${p.tto}، ويُتوقع ازدحام مروري في محيطها. يُرجى التنسيق المسبق لتحركات البعثة.`,
        alert: p => `يُرجى رفع مستوى الحيطة الأمنية في مقر البعثة ومنزل رئيسها حتى ${p.until}، ومراجعة إجراءات الطوارئ الداخلية، والإبلاغ فوراً عن أي ملاحظة عبر زر البلاغ الطارئ.`
      }
    },
    en: {
      ui: { ack: "Acknowledge", sec: "Dubai Police advisories", chkT: "Dubai Police is checking on you", chkSub: "Please confirm the status of the mission and its staff", safe: "We are safe", help: "We need assistance",
        note: "Note (optional)", sentSafe: "Your reply was sent: the mission is safe", sentHelp: "Your request for assistance was sent; the Operations Room will contact you", none: "No advisories at the moment",
        newAdv: "New advisory from Dubai Police", newChk: "Dubai Police is checking on you — please reply", sentAt: "Sent", from: "from", to: "to", areaL: "Area", dateL: "Date", untilL: "Until" },
      reason: { weather: "due to the weather situation", incident: "following a security incident", event: "during a major event", drill: "a drill to test communication readiness", general: "" },
      title: { roads: "Road closures", weather: "Weather alert", event: "Major event", alert: "Heightened vigilance", custom: "Advisory" },
      opt: { event: "due to a public event", celebration: "due to celebrations", works: "due to roadworks", rain: "heavy rain", wind: "strong winds raising dust", fog: "dense fog" },
      tpl: {
        roads: p => `Some roads in ${p.area} will be closed on ${p.date} from ${p.tfrom} to ${p.tto} ${p.opt}. Please take this into account for the movements of mission staff and guests, and use alternative routes.`,
        weather: p => `Forecasts indicate ${p.opt} in Dubai on ${p.date}. Please limit non-essential travel and make sure safety procedures at the mission premises are in place.`,
        event: p => `A major event will take place in ${p.area} on ${p.date} from ${p.tfrom} to ${p.tto}, and heavy traffic is expected nearby. Please plan the mission's movements in advance.`,
        alert: p => `Please raise the level of security vigilance at the mission premises and the head of mission's residence until ${p.until}, review internal emergency procedures, and report any concern immediately via the emergency button.`
      }
    },
    zh: {
      ui: { ack: "已阅", sec: "迪拜警方通告", chkT: "迪拜警方向您问安", chkSub: "请确认使团及其人员的状况", safe: "我们安全", help: "我们需要协助",
        note: "备注（可选）", sentSafe: "已发送回复：使团安全", sentHelp: "求助请求已发送，行动指挥室将与您联系", none: "目前没有通告",
        newAdv: "迪拜警方新通告", newChk: "迪拜警方向您问安——请回复", sentAt: "发送于", from: "从", to: "至", areaL: "区域", dateL: "日期", untilL: "截至" },
      reason: { weather: "因天气状况", incident: "因安全事件", event: "因大型活动", drill: "通讯准备演练", general: "" },
      title: { roads: "道路封闭", weather: "天气预警", event: "大型活动", alert: "提高警戒", custom: "通告" },
      opt: { event: "因公共活动", celebration: "因庆祝活动", works: "因道路施工", rain: "强降雨", wind: "大风扬尘", fog: "浓雾" },
      tpl: {
        roads: p => `${p.date} ${p.tfrom} 至 ${p.tto}，${p.area} 的部分道路将${p.opt}封闭。请在安排使团人员及来宾出行时予以考虑，并选择替代路线。`,
        weather: p => `预计 ${p.date} 迪拜将出现${p.opt}。请减少不必要的出行，并确保使团馆舍的安全措施到位。`,
        event: p => `${p.date} ${p.tfrom} 至 ${p.tto}，${p.area} 将举行大型活动，周边预计交通拥堵。请提前安排使团出行。`,
        alert: p => `请在 ${p.until} 前提高使团馆舍及馆长官邸的安全警戒，检查内部应急程序，如有任何情况请立即通过紧急按钮报告。`
      }
    },
    fr: {
      ui: { ack: "Lu et compris", sec: "Avis de la Police de Dubaï", chkT: "La Police de Dubaï prend de vos nouvelles", chkSub: "Veuillez confirmer la situation de la mission et de son personnel", safe: "Tout va bien", help: "Nous avons besoin d'aide",
        note: "Remarque (facultatif)", sentSafe: "Réponse envoyée : la mission va bien", sentHelp: "Demande d'aide envoyée ; la salle des opérations vous contactera", none: "Aucun avis pour le moment",
        newAdv: "Nouvel avis de la Police de Dubaï", newChk: "La Police de Dubaï prend de vos nouvelles — merci de répondre", sentAt: "Envoyé", from: "de", to: "à", areaL: "Zone", dateL: "Date", untilL: "Jusqu'au" },
      reason: { weather: "en raison des conditions météorologiques", incident: "à la suite d'un incident de sécurité", event: "lors d'un événement majeur", drill: "exercice de test de la communication", general: "" },
      title: { roads: "Fermetures de routes", weather: "Alerte météo", event: "Événement majeur", alert: "Vigilance renforcée", custom: "Avis" },
      opt: { event: "en raison d'un événement public", celebration: "en raison de célébrations", works: "en raison de travaux", rain: "de fortes pluies", wind: "des vents forts soulevant de la poussière", fog: "un brouillard dense" },
      tpl: {
        roads: p => `Certaines routes du secteur ${p.area} seront fermées le ${p.date} de ${p.tfrom} à ${p.tto} ${p.opt}. Merci d'en tenir compte pour les déplacements du personnel et des invités de la mission et d'emprunter des itinéraires alternatifs.`,
        weather: p => `Les prévisions annoncent ${p.opt} à Dubaï le ${p.date}. Merci de limiter les déplacements non essentiels et de vérifier les mesures de sécurité dans les locaux de la mission.`,
        event: p => `Un événement majeur aura lieu à ${p.area} le ${p.date} de ${p.tfrom} à ${p.tto} ; une forte circulation est attendue aux alentours. Merci de planifier à l'avance les déplacements de la mission.`,
        alert: p => `Merci de renforcer la vigilance sécuritaire dans les locaux de la mission et la résidence du chef de mission jusqu'au ${p.until}, de revoir les procédures d'urgence internes et de signaler immédiatement tout fait via le bouton d'urgence.`
      }
    },
    es: {
      ui: { ack: "Leído", sec: "Avisos de la Policía de Dubái", chkT: "La Policía de Dubái se interesa por ustedes", chkSub: "Confirmen la situación de la misión y de su personal", safe: "Estamos bien", help: "Necesitamos ayuda",
        note: "Nota (opcional)", sentSafe: "Respuesta enviada: la misión está bien", sentHelp: "Solicitud de ayuda enviada; la sala de operaciones se pondrá en contacto", none: "No hay avisos por ahora",
        newAdv: "Nuevo aviso de la Policía de Dubái", newChk: "La Policía de Dubái se interesa por ustedes — respondan, por favor", sentAt: "Enviado", from: "de", to: "a", areaL: "Zona", dateL: "Fecha", untilL: "Hasta" },
      reason: { weather: "debido a la situación meteorológica", incident: "tras un incidente de seguridad", event: "durante un gran evento", drill: "simulacro de comunicación", general: "" },
      title: { roads: "Cierre de vías", weather: "Alerta meteorológica", event: "Gran evento", alert: "Mayor vigilancia", custom: "Aviso" },
      opt: { event: "por un evento público", celebration: "por celebraciones", works: "por obras", rain: "lluvias intensas", wind: "fuertes vientos con polvo", fog: "niebla densa" },
      tpl: {
        roads: p => `Algunas vías de ${p.area} estarán cerradas el ${p.date} de ${p.tfrom} a ${p.tto} ${p.opt}. Ténganlo en cuenta para los desplazamientos del personal y de los invitados de la misión y utilicen rutas alternativas.`,
        weather: p => `Las previsiones indican ${p.opt} en Dubái el ${p.date}. Limiten los desplazamientos no esenciales y verifiquen las medidas de seguridad en la sede de la misión.`,
        event: p => `Se celebrará un gran evento en ${p.area} el ${p.date} de ${p.tfrom} a ${p.tto} y se espera mucho tráfico en los alrededores. Planifiquen con antelación los desplazamientos de la misión.`,
        alert: p => `Eleven el nivel de vigilancia en la sede de la misión y en la residencia del jefe de misión hasta el ${p.until}, revisen los procedimientos internos de emergencia y comuniquen de inmediato cualquier incidencia mediante el botón de emergencia.`
      }
    },
    ru: {
      ui: { ack: "Ознакомлены", sec: "Уведомления полиции Дубая", chkT: "Полиция Дубая интересуется вашим положением", chkSub: "Подтвердите, пожалуйста, состояние миссии и её сотрудников", safe: "У нас всё в порядке", help: "Нам нужна помощь",
        note: "Комментарий (необязательно)", sentSafe: "Ответ отправлен: у миссии всё в порядке", sentHelp: "Запрос о помощи отправлен; оперативный центр свяжется с вами", none: "Уведомлений пока нет",
        newAdv: "Новое уведомление полиции Дубая", newChk: "Полиция Дубая интересуется вашим положением — ответьте, пожалуйста", sentAt: "Отправлено", from: "с", to: "до", areaL: "Район", dateL: "Дата", untilL: "До" },
      reason: { weather: "в связи с погодными условиями", incident: "после инцидента безопасности", event: "во время крупного мероприятия", drill: "учение по проверке связи", general: "" },
      title: { roads: "Перекрытие дорог", weather: "Погодное предупреждение", event: "Крупное мероприятие", alert: "Повышенная бдительность", custom: "Уведомление" },
      opt: { event: "в связи с публичным мероприятием", celebration: "в связи с празднованием", works: "в связи с дорожными работами", rain: "сильный дождь", wind: "сильный ветер с пылью", fog: "густой туман" },
      tpl: {
        roads: p => `${p.date} с ${p.tfrom} до ${p.tto} некоторые дороги в районе ${p.area} будут перекрыты ${p.opt}. Учтите это при передвижении сотрудников и гостей миссии и используйте объездные маршруты.`,
        weather: p => `По прогнозу ${p.date} в Дубае ожидается ${p.opt}. Ограничьте необязательные поездки и проверьте меры безопасности в помещениях миссии.`,
        event: p => `${p.date} с ${p.tfrom} до ${p.tto} в районе ${p.area} пройдёт крупное мероприятие; ожидается интенсивное движение. Заранее спланируйте передвижения миссии.`,
        alert: p => `Повысьте уровень бдительности в помещениях миссии и резиденции её главы до ${p.until}, проверьте внутренние процедуры на случай чрезвычайных ситуаций и незамедлительно сообщайте о любых подозрениях через кнопку экстренного вызова.`
      }
    },
    hi: {
      ui: { ack: "पढ़ लिया", sec: "दुबई पुलिस की सूचनाएँ", chkT: "दुबई पुलिस आपकी कुशलता जानना चाहती है", chkSub: "कृपया मिशन और उसके कर्मचारियों की स्थिति की पुष्टि करें", safe: "हम सुरक्षित हैं", help: "हमें सहायता चाहिए",
        note: "टिप्पणी (वैकल्पिक)", sentSafe: "आपका उत्तर भेजा गया: मिशन सुरक्षित है", sentHelp: "सहायता अनुरोध भेजा गया; ऑपरेशन रूम आपसे संपर्क करेगा", none: "फ़िलहाल कोई सूचना नहीं",
        newAdv: "दुबई पुलिस की नई सूचना", newChk: "दुबई पुलिस आपकी कुशलता जानना चाहती है — कृपया उत्तर दें", sentAt: "भेजा गया", from: "से", to: "तक", areaL: "क्षेत्र", dateL: "तारीख", untilL: "तक" },
      reason: { weather: "मौसम की स्थिति के कारण", incident: "एक सुरक्षा घटना के बाद", event: "एक बड़े आयोजन के दौरान", drill: "संचार तत्परता की जाँच हेतु अभ्यास", general: "" },
      title: { roads: "सड़कें बंद", weather: "मौसम चेतावनी", event: "बड़ा आयोजन", alert: "बढ़ी हुई सतर्कता", custom: "सूचना" },
      opt: { event: "एक सार्वजनिक आयोजन के कारण", celebration: "समारोहों के कारण", works: "सड़क कार्य के कारण", rain: "भारी बारिश", wind: "धूल भरी तेज़ हवाएँ", fog: "घना कोहरा" },
      tpl: {
        roads: p => `${p.area} क्षेत्र की कुछ सड़कें ${p.date} को ${p.tfrom} से ${p.tto} तक ${p.opt} बंद रहेंगी। कृपया मिशन के कर्मचारियों और अतिथियों की आवाजाही में इसका ध्यान रखें और वैकल्पिक मार्ग अपनाएँ।`,
        weather: p => `पूर्वानुमान के अनुसार ${p.date} को दुबई में ${p.opt} की संभावना है। कृपया अनावश्यक यात्रा सीमित करें और मिशन परिसर में सुरक्षा उपाय सुनिश्चित करें।`,
        event: p => `${p.date} को ${p.tfrom} से ${p.tto} तक ${p.area} में एक बड़ा आयोजन होगा और आसपास भारी यातायात की संभावना है। कृपया मिशन की आवाजाही पहले से योजना बनाएँ।`,
        alert: p => `कृपया ${p.until} तक मिशन परिसर और मिशन प्रमुख के निवास पर सुरक्षा सतर्कता बढ़ाएँ, आंतरिक आपात प्रक्रियाओं की समीक्षा करें और किसी भी चिंता की सूचना तुरंत आपात बटन से दें।`
      }
    },
    pt: {
      ui: { ack: "Tomámos conhecimento", sec: "Avisos da Polícia de Dubai", chkT: "A Polícia de Dubai quer saber como estão", chkSub: "Confirmem a situação da missão e do seu pessoal", safe: "Estamos bem", help: "Precisamos de ajuda",
        note: "Observação (opcional)", sentSafe: "Resposta enviada: a missão está bem", sentHelp: "Pedido de ajuda enviado; a sala de operações entrará em contacto", none: "Sem avisos no momento",
        newAdv: "Novo aviso da Polícia de Dubai", newChk: "A Polícia de Dubai quer saber como estão — respondam, por favor", sentAt: "Enviado", from: "das", to: "às", areaL: "Zona", dateL: "Data", untilL: "Até" },
      reason: { weather: "devido às condições meteorológicas", incident: "após um incidente de segurança", event: "durante um grande evento", drill: "simulação de prontidão de comunicação", general: "" },
      title: { roads: "Encerramento de vias", weather: "Alerta meteorológico", event: "Grande evento", alert: "Vigilância reforçada", custom: "Aviso" },
      opt: { event: "devido a um evento público", celebration: "devido a celebrações", works: "devido a obras", rain: "chuva forte", wind: "ventos fortes com poeira", fog: "nevoeiro denso" },
      tpl: {
        roads: p => `Algumas vias em ${p.area} estarão encerradas em ${p.date} das ${p.tfrom} às ${p.tto} ${p.opt}. Tenham isso em conta nas deslocações do pessoal e dos convidados da missão e utilizem percursos alternativos.`,
        weather: p => `As previsões indicam ${p.opt} em Dubai em ${p.date}. Limitem as deslocações não essenciais e confirmem as medidas de segurança nas instalações da missão.`,
        event: p => `Um grande evento terá lugar em ${p.area} em ${p.date} das ${p.tfrom} às ${p.tto}, com trânsito intenso previsto nas imediações. Planeiem antecipadamente as deslocações da missão.`,
        alert: p => `Reforcem o nível de vigilância nas instalações da missão e na residência do chefe de missão até ${p.until}, revejam os procedimentos internos de emergência e comuniquem de imediato qualquer situação através do botão de emergência.`
      }
    },
    de: {
      ui: { ack: "Zur Kenntnis genommen", sec: "Hinweise der Polizei Dubai", chkT: "Die Polizei Dubai erkundigt sich nach Ihnen", chkSub: "Bitte bestätigen Sie die Lage der Vertretung und ihres Personals", safe: "Uns geht es gut", help: "Wir brauchen Hilfe",
        note: "Anmerkung (optional)", sentSafe: "Antwort gesendet: Der Vertretung geht es gut", sentHelp: "Hilfeersuchen gesendet; die Einsatzzentrale meldet sich bei Ihnen", none: "Derzeit keine Hinweise",
        newAdv: "Neuer Hinweis der Polizei Dubai", newChk: "Die Polizei Dubai erkundigt sich nach Ihnen — bitte antworten", sentAt: "Gesendet", from: "von", to: "bis", areaL: "Gebiet", dateL: "Datum", untilL: "Bis" },
      reason: { weather: "aufgrund der Wetterlage", incident: "nach einem Sicherheitsvorfall", event: "während einer Großveranstaltung", drill: "Übung zur Kommunikationsbereitschaft", general: "" },
      title: { roads: "Straßensperrungen", weather: "Wetterwarnung", event: "Großveranstaltung", alert: "Erhöhte Wachsamkeit", custom: "Hinweis" },
      opt: { event: "wegen einer öffentlichen Veranstaltung", celebration: "wegen Feierlichkeiten", works: "wegen Straßenarbeiten", rain: "Starkregen", wind: "starker Wind mit Staub", fog: "dichter Nebel" },
      tpl: {
        roads: p => `Einige Straßen in ${p.area} sind am ${p.date} von ${p.tfrom} bis ${p.tto} ${p.opt} gesperrt. Bitte berücksichtigen Sie dies bei Fahrten des Personals und der Gäste der Vertretung und nutzen Sie Ausweichrouten.`,
        weather: p => `Die Vorhersage kündigt für den ${p.date} in Dubai ${p.opt} an. Bitte vermeiden Sie nicht notwendige Fahrten und prüfen Sie die Sicherheitsvorkehrungen in den Räumlichkeiten der Vertretung.`,
        event: p => `Am ${p.date} findet von ${p.tfrom} bis ${p.tto} in ${p.area} eine Großveranstaltung statt; in der Umgebung wird starker Verkehr erwartet. Bitte planen Sie die Fahrten der Vertretung im Voraus.`,
        alert: p => `Bitte erhöhen Sie bis zum ${p.until} die Sicherheitswachsamkeit in den Räumlichkeiten der Vertretung und in der Residenz des Missionschefs, überprüfen Sie die internen Notfallabläufe und melden Sie jede Auffälligkeit sofort über die Notruftaste.`
      }
    },
    ja: {
      ui: { ack: "確認しました", sec: "ドバイ警察からのお知らせ", chkT: "ドバイ警察が安否を確認しています", chkSub: "公館および職員の状況をご確認ください", safe: "無事です", help: "支援が必要です",
        note: "備考（任意）", sentSafe: "回答を送信しました：公館は無事です", sentHelp: "支援要請を送信しました。オペレーションルームから連絡します", none: "現在お知らせはありません",
        newAdv: "ドバイ警察からの新しいお知らせ", newChk: "ドバイ警察が安否を確認しています — ご回答ください", sentAt: "送信", from: "", to: "～", areaL: "地域", dateL: "日付", untilL: "まで" },
      reason: { weather: "気象状況のため", incident: "治安上の事案を受けて", event: "大規模イベント開催中のため", drill: "連絡体制確認のための訓練", general: "" },
      title: { roads: "道路閉鎖", weather: "気象警報", event: "大規模イベント", alert: "警戒強化", custom: "お知らせ" },
      opt: { event: "公共イベントのため", celebration: "祝賀行事のため", works: "道路工事のため", rain: "大雨", wind: "砂塵を伴う強風", fog: "濃霧" },
      tpl: {
        roads: p => `${p.date} ${p.tfrom}～${p.tto}、${p.area}の一部道路が${p.opt}閉鎖されます。公館職員および来賓の移動の際はご留意いただき、迂回路をご利用ください。`,
        weather: p => `${p.date}、ドバイでは${p.opt}が予想されています。不要不急の移動を控え、公館施設の安全対策をご確認ください。`,
        event: p => `${p.date} ${p.tfrom}～${p.tto}、${p.area}で大規模イベントが開催され、周辺の交通混雑が予想されます。公館の移動は事前にご計画ください。`,
        alert: p => `${p.until}まで、公館施設および公館長公邸における警戒レベルを引き上げ、内部の緊急時手順を見直し、懸念事項は緊急ボタンから直ちにご報告ください。`
      }
    }
  };
  const loc = { ar: "ar-AE-u-nu-latn", en: "en-GB", zh: "zh-CN", fr: "fr-FR", es: "es-ES", ru: "ru-RU", hi: "hi-IN", pt: "pt-PT", de: "de-DE", ja: "ja-JP" };
  const g = lang => L[lang] || L.en;
  const fmtDay = (iso, lang) => { if (!iso) return ""; const d = new Date(iso + "T12:00:00"); try { return d.toLocaleDateString(loc[lang] || "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch (e) { return iso; } };

  window.BC = {
    LANGS: Object.keys(L),
    ui: (lang, k) => g(lang).ui[k] || L.en.ui[k] || "",
    reason: (lang, k) => g(lang).reason[k] || "",
    title(b, lang) { const a = b.advisory || {}; return a.tpl === "custom" && (lang === "ar" ? a.titleAr : (a.titleEn || a.titleAr)) || g(lang).title[a.tpl] || g(lang).title.custom; },
    // نص التعميم بلغة البعثة
    text(b, lang) {
      const a = b.advisory || {}, x = g(lang);
      if (a.tpl === "custom") return lang === "ar" ? (a.textAr || a.textEn || "") : (a.textEn || a.textAr || "");
      const fn = x.tpl[a.tpl]; if (!fn) return "";
      return fn({ area: lang === "ar" ? (a.area || a.areaEn || "") : (a.areaEn || a.area || ""), date: fmtDay(a.date, lang), until: fmtDay(a.until, lang),
        tfrom: a.tfrom || "", tto: a.tto || "", opt: x.opt[a.opt] || "" });
    },
    // نصوص لوحة الشرطة (عربي)
    TPL_AR: L.ar.title, OPT_AR: L.ar.opt, REASON_AR: L.ar.reason,
    targets(b, sites) { return b.targets === "all" || !b.targets ? sites.filter(s => (s.type || "consulate") === "consulate") : sites.filter(s => b.targets.includes(s.id)); },
    isFor(b, missionId) { return b.targets === "all" || !b.targets || (Array.isArray(b.targets) && b.targets.includes(missionId)); }
  };
})();
