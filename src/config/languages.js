// src/config/languages.js - NEW FILE
module.exports = {
  languages: {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    ta: 'தமிழ் (Tamil)',
    te: 'తెలుగు (Telugu)',
    kn: 'ಕನ್ನಡ (Kannada)',
    ml: 'മലയാളം (Malayalam)',
    bn: 'বাংলা (Bengali)',
    mr: 'मराठी (Marathi)'
  },

  translations: {
    // Common messages
    welcome: {
      en: 'Welcome to SMAX',
      hi: 'SMAX में आपका स्वागत है',
      ta: 'SMAX க்கு வரவேற்கிறோம்',
      te: 'SMAX కి స్వాగతం'
    },

    // Notifications
    newMessage: {
      en: 'New message received',
      hi: 'नया संदेश प्राप्त हुआ',
      ta: 'புதிய செய்தி பெறப்பட்டது',
      te: 'కొత్త సందేశం అందింది'
    },

    newCall: {
      en: 'Incoming call',
      hi: 'आने वाली कॉल',
      ta: 'உள்வரும் அழைப்பு',
      te: 'ఇన్‌కమింగ్ కాల్'
    },

    adApproved: {
      en: 'Your ad has been approved',
      hi: 'आपका विज्ञापन स्वीकृत हो गया है',
      ta: 'உங்கள் விளம்பரம் அங்கீகரிக்கப்பட்டது',
      te: 'మీ ప్రకటన ఆమోదించబడింది'
    },

    adRejected: {
      en: 'Your ad has been rejected',
      hi: 'आपका विज्ञापन अस्वीकार कर दिया गया है',
      ta: 'உங்கள் விளம்பரம் நிராகரிக்கப்பட்டது',
      te: 'మీ ప్రకటన తిరస్కరించబడింది'
    },

    // Role messages
    switchedToBuyer: {
      en: 'Switched to Buyer mode',
      hi: 'खरीदार मोड में स्विच किया गया',
      ta: 'வாங்குபவர் பயன்முறைக்கு மாற்றப்பட்டது',
      te: 'కొనుగోలుదారు మోడ్‌కి మారింది'
    },

    switchedToSeller: {
      en: 'Switched to Seller mode',
      hi: 'विक्रेता मोड में स्विच किया गया',
      ta: 'விற்பவர் பயன்முறைக்கு மாற்றப்பட்டது',
      te: 'అమ్మకందారు మోడ్‌కి మారింది'
    }
  },

  // Helper function to get translation
  t: function(key, lang = 'en') {
    return this.translations[key]?.[lang] || this.translations[key]?.en || key;
  }
};