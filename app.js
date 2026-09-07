/**
 * MoneyApp - Buget & Cheltuieli
 * Gestionare buget personal direct in browser
 */

// Culori presetate pentru categorii (Paletă extinsă de nuanțe moderne)
const PRESET_COLORS = [
    // Verde & Smarald
    '#10b981', '#059669', '#047857', '#16a34a', '#22c55e', '#4ade80', '#84cc16', '#65a30d',
    // Cyan, Turcoaz & Aqua
    '#14b8a6', '#0d9488', '#0f766e', '#06b6d4', '#0891b2', '#0284c7', '#38bdf8', '#0ea5e9',
    // Albastru & Indigo & Navy
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e3a8a', '#6366f1', '#4f46e5', '#4338ca',
    // Violet, Mov & Lavandă
    '#8b5cf6', '#7c3aed', '#6d28d9', '#a855f7', '#9333ea', '#c084fc',
    // Roz, Magenta, Fuchsia & Zmeură
    '#ec4899', '#db2777', '#be185d', '#d946ef', '#c026d3', '#f43f5e', '#e11d48', '#9f1239',
    // Roșu, Coral & Portocaliu
    '#ef4444', '#dc2626', '#b91c1c', '#f87171', '#f97316', '#ea580c', '#c2410c', '#ff5722',
    // Chihlimbar, Auriu & Cafea/Maro
    '#f59e0b', '#d97706', '#b45309', '#eab308', '#ca8a04', '#854d0e', '#78350f',
    // Ardezie, Oțel & Cărbune / Neutre
    '#64748b', '#475569', '#334155', '#1e293b', '#71717a', '#52525b', '#78716c', '#57534e'
];

const DEFAULT_CATEGORIES = [
    { id: 'cat-1', name: 'Mâncare & Alimente', color: '#10b981', icon: '🛒' },
    { id: 'cat-2', name: 'Facturi & Utilități', color: '#ef4444', icon: '⚡' },
    { id: 'cat-3', name: 'Transport & Combustibil', color: '#f59e0b', icon: '🚗' },
    { id: 'cat-4', name: 'Locuință & Chirie', color: '#6366f1', icon: '🏠' },
    { id: 'cat-5', name: 'Sănătate & Farmacie', color: '#ec4899', icon: '💊' },
    { id: 'cat-6', name: 'Cumpărături & Haine', color: '#8b5cf6', icon: '🛍️' },
    { id: 'cat-7', name: 'Divertisment & Ieșiri', color: '#06b6d4', icon: '🎬' },
    { id: 'cat-8', name: 'Economii & Rate', color: '#14b8a6', icon: '💰' },
    { id: 'cat-9', name: 'Altele', color: '#64748b', icon: '📦' }
];

// Initial State
let appData = {
    categories: [...DEFAULT_CATEGORIES],
    transactions: [],
    settings: {
        eurRate: 4.98,
        theme: 'dark',
        mainCurrency: 'RON',
        secondaryCurrency: 'auto'
    }
};
window.appData = appData;

let donutChartInstance = null;
let monthlyBarChartInstance = null;
let statsWeekdayChartInstance = null;
let statsHourlyChartInstance = null;
let statsMonthDaysChartInstance = null;
let currentStatsPeriod = 'month';
let currentPeriodCategoryData = []; // Cached category data for active chart
let selectedCurrency = 'RON';
const APP_VERSION = "3.3.55";

function updateAppVersionBadge() {
    const badge = document.getElementById('appVersionBadge');
    if (!badge) return;
    let vName = APP_VERSION;
    if (window.AndroidBridge && typeof window.AndroidBridge.getAppVersion === 'function') {
        try {
            const nativeVer = window.AndroidBridge.getAppVersion();
            if (nativeVer && nativeVer.trim().length > 0) {
                vName = nativeVer.trim();
            }
        } catch (e) {}
    }
    badge.textContent = vName.startsWith('v') ? vName : `v${vName}`;
}

// Suport Monede Mondiale Majore
const WORLD_CURRENCIES = [
    { code: 'RON', name: 'Leu Românesc', symbol: 'RON', flag: '🇷🇴', rateToRon: 1.00 },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rateToRon: 4.98 },
    { code: 'USD', name: 'Dolar American', symbol: '$', flag: '🇺🇸', rateToRon: 4.60 },
    { code: 'GBP', name: 'Liră Sterlină', symbol: '£', flag: '🇬🇧', rateToRon: 5.85 },
    { code: 'CHF', name: 'Franc Elvețian', symbol: 'CHF', flag: '🇨🇭', rateToRon: 5.30 },
    { code: 'INR', name: 'Rupie Indiană', symbol: '₹', flag: '🇮🇳', rateToRon: 0.055 },
    { code: 'CNY', name: 'Yuan Chinezesc', symbol: '¥', flag: '🇨🇳', rateToRon: 0.65 },
    { code: 'JPY', name: 'Yen Japonez', symbol: '¥', flag: '🇯🇵', rateToRon: 0.031 },
    { code: 'TRY', name: 'Liră Turcească', symbol: '₺', flag: '🇹🇷', rateToRon: 0.135 },
    { code: 'EGP', name: 'Liră Egipteană', symbol: 'E£', flag: '🇪🇬', rateToRon: 0.095 },
    { code: 'MDL', name: 'Leu Moldovenesc', symbol: 'MDL', flag: '🇲🇩', rateToRon: 0.26 },
    { code: 'CAD', name: 'Dolar Canadian', symbol: 'C$', flag: '🇨🇦', rateToRon: 3.40 },
    { code: 'AUD', name: 'Dolar Australian', symbol: 'A$', flag: '🇦🇺', rateToRon: 3.05 }
];

// Mapare Monedă -> Limbă oficială / internațională
const CURRENCY_TO_LANG = {
    'RON': 'ro',
    'MDL': 'ro',
    'EUR': 'en',
    'USD': 'en',
    'GBP': 'en',
    'CAD': 'en',
    'AUD': 'en',
    'CHF': 'de',
    'TRY': 'tr',
    'JPY': 'ja',
    'CNY': 'zh',
    'INR': 'en',
    'EGP': 'en'
};

const I18N_DICTIONARY = {
    ro: {
        currency_label: 'Monedă',
        tab_overview: 'Panou',
        tab_overview_full: 'Panou General',
        tab_transactions: 'Tranzacții',
        tab_transactions_full: 'Tranzacții (Istoric)',
        tab_stats: 'Statistici',
        tab_stats_full: 'Statistici',
        tab_categories: 'Categorii',
        tab_categories_full: 'Categorii',
        balance_title: 'Fond Disponibil',
        total_expenses: 'Cheltuieli Totale',
        total_income: 'Venituri Totale',
        btn_expense: 'Cheltuială',
        btn_income: 'Venit',
        expenses_by_cat: 'Categorii',
        total_month: 'Total Lună',
        categories_list_title: 'Listă Categorii & Cheltuieli',
        period_current_month: 'Luna Aceasta',
        period_last_month: 'Luna Trecută',
        period_current_year: 'Anul Acesta',
        period_all: 'Toată Perioada',
        qr_title: 'Conectare pe alt Telefon',
        qr_desc: 'Scanează QR sau instalează',
        btn_open_qr: 'Deschide QR',
        btn_install_guide: 'Ghid Instalare',
        modal_add_expense: 'Adaugă Cheltuială',
        modal_edit_expense: 'Modifică Cheltuială',
        modal_add_income: 'Adaugă Venit',
        modal_edit_income: 'Modifică Venit',
        lbl_amount: 'Suma',
        lbl_date: 'Data',
        lbl_category: 'Alege Categoria',
        lbl_note: 'Descriere / Notiță (opțional)',
        lbl_income_source: 'Sursă Venit / Notă',
        placeholder_amount: 'Sumă (Ex: 45.50)',
        placeholder_desc: 'Ex: Cumpărături, Benzină',
        placeholder_article: 'Articol',
        placeholder_store: 'Magazin',
        placeholder_add_merchant: '+ Magazin nou...',
        placeholder_income_amount: 'Venit (Ex: 3500)',
        placeholder_income_source: 'Ex: Salariu, Avans, Bonus, Chirie',
        lbl_suspend_tx: '⏸️ Suspendă tranzacția (exclude temporar din calcule)',
        suspended_tx_title: 'Tranzacții Suspendate',
        suspended_tx_desc: 'Aceste tranzacții sunt temporar excluse din calculele soldului, graficelor și rapoartelor. Le puteți reactiva, modifica sau șterge oricând.',
        no_suspended_tx: 'Nu există nicio tranzacție suspendată.',
        btn_save: 'Salvează',
        btn_cancel: 'Anulează',
        history_title: 'Istoric Tranzacții',
        search_placeholder: 'Caută după descriere...',
        filter_all: 'Toate',
        filter_expenses: 'Cheltuieli',
        filter_incomes: 'Venituri',
        reports_title: 'Raport & Statistici',
        annual_income: 'Venituri Anuale',
        annual_expenses: 'Cheltuieli Anuale',
        net_savings: 'Economii Nete',
        savings_rate: 'Rată Economisire',
        monthly_evolution: 'Evoluție Lunară (Venituri vs Cheltuieli)',
        categories_title: 'Categorii de Cheltuieli',
        btn_new_category: '+ Categorie Nouă',
        categories_desc: 'Puteți adăuga oricâte categorii doriți, fiecare având propria culoare și pictogramă.',
        no_expenses: 'Fără Cheltuieli',
        ops_suffix: 'op.',
        months: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
        monthsShort: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'],
        year_prefix: 'Anul',
        backup_title: 'Salvare & Restaurare Date',
        backup_desc: 'Copia de siguranță conține absolut toate datele dvs.: tranzacțiile, categoriile personalizate, setările și tema interfeței (Dark/Light). La import, întreaga aplicație este restaurată identic.',
        btn_export_data: 'Exportă Date (Descarcă fișier Backup)',
        btn_import_data: 'Importă Date (Încarcă fișier Backup)',
        btn_close: 'Închide',
        conv_title: 'Convertor & Cursuri Valutare',
        conv_active_label: 'Monedă Implicită (Activă):',
        conv_amount_label: 'Sumă de convertit în celelalte monede:',
        conv_use_balance: '💰 Sold Disponibil',
        conv_results_title: 'Conversie în celelalte monede:',
        conv_adjust_rate: '⚙️ Ajustează Cursul de Referință Euro (EUR/RON)',
        conv_save_rate: 'Salvează Cursul Euro',
        conv_active_count: 'monede active',
        conv_status_title: 'Cursuri Oficiale Live (BCE)',
        conv_btn_refresh: 'Actualizează',
        rates_updated_toast: 'Cursuri valutare actualizate cu succes!',
        rates_offline_toast: 'Mod offline: s-au folosit ultimele cursuri salvate.',
        rates_updated_at: 'Actualizat',
        guide_modal_title: 'Cum adaugi MoneyApp în Browser & Telefon',
        guide_step1: '<strong>Pe Telefon Android (Google Chrome):</strong><br>Deschideți linkul aplicației în Chrome, apăsați pe cele <strong>3 puncte verticale (⋮)</strong> din colțul dreapta-sus și alegeți <strong>„Adaugă la ecranul de pornire”</strong> (sau „Instalează aplicația”).',
        guide_step2: '<strong>Pe iPhone / iPad (Safari):</strong><br>Deschideți pagina în Safari, apăsați pe butonul <strong>Partajare (Share - pătrat cu săgeată în sus)</strong> din partea de jos, derulați și alegeți <strong>„Adaugă la ecranul principal”</strong>.',
        guide_step3: '<strong>Pe Calculator (Google Chrome / Edge):</strong><br>Apăsați pe pictograma de instalare din bara de adrese a browserului (dreapta) sau apăsați <strong>Ctrl + D</strong> pentru a adăuga un Marcaj (Bookmark) direct pe bara de favorite.',
        guide_step4: '<strong>Sau descărcare directă ca aplicație Android (APK):</strong><br>Puteți descărca direct fișierul instalator pentru a-l trimite oricui pe WhatsApp.',
        guide_btn_apk: 'Descarcă fișierul MoneyApp.apk',
        guide_btn_gotit: 'Am înțeles',
        qr_modal_title: '📱 Conectare Telefon',
        qr_modal_desc: 'Pentru a deschide aplicația pe telefonul dvs., scanați codul QR de mai jos:',
        qr_step1: 'Deschideți <strong>Camera foto</strong> pe telefonul dvs.',
        qr_step2: 'Îndreptați camera spre <strong>codul QR de mai sus</strong>.',
        qr_step3: 'Atingeți <strong>linkul apărut</strong> pe ecran pentru a deschide MoneyApp în <strong>Browser</strong>!',
        qr_btn_copy: 'Copiază',
        btn_download_apk: 'Descarcă MoneyApp_v3.3.55.apk',
        link_copied: 'Link copiat în clipboard!',
        lbl_selected_period: 'Perioada selectată',
        lbl_total_spent: 'Total cheltuit',
        lbl_of_period_expenses: 'din cheltuielile perioadei',
        lbl_category_transactions: 'Tranzacții din această categorie:',
        btn_close_to_chart: 'Închide și revino la grafic',
        empty_category_expenses: 'Nu sunt cheltuieli în această categorie pentru perioada selectată.',
        modal_add_category: 'Adaugă Categorie Nouă',
        modal_edit_category: 'Editează Categorie',
        lbl_category_name: 'Nume Categorie *',
        placeholder_category_name: 'Ex: Farmacie, Cadouri, Combustibil',
        lbl_category_icon: 'Iconiță / Emoji',
        lbl_category_color: 'Culoare Categorie *',
        lbl_recommended_colors: 'Culori rapide recomandate:',
        btn_save_category: 'Salvează Categoria',
        lbl_registered_expenses: 'cheltuieli înregistrate',
        export_btn_copy: '📋 Copiază',
        export_btn_whatsapp: '💬 WhatsApp',
        export_btn_print: '🖨️ PDF',
        export_btn_download: '💾 .txt',
        export_copied_toast: 'Text copiat în clipboard!',
        export_downloaded_toast: 'Fișier descărcat cu succes!',
        currency_modal_title: 'Alege Moneda Principală',
        currency_modal_desc: 'Selectați moneda în care doriți să opereze <strong>MoneyApp</strong>. Toate datele, soldul, cheltuielile, veniturile și graficele vor fi recalculate și afișate automat în moneda aleasă.',
        currency_ref_label: 'Monedă de Referință',
        currency_active_badge: '✓ Activă',
        stat_dashboard_sub: 'Tablou de Bord Financiar & Analiză Cashflow',
        stat_pill_month: 'Luna Aceasta',
        stat_pill_3months: '3 Luni',
        stat_pill_year: 'Anul Curent',
        stat_pill_all: 'Tot',
        stat_income: 'Venituri',
        stat_expense: 'Cheltuieli',
        stat_daily_avg: 'Medie Plăți/zi',
        stat_daily_sub: 'Ritmul de cheltuire',
        stat_peak_exp: 'Vârf Cheltuială',
        stat_daily_income: 'Medie Venit/zi',
        stat_income_pace: 'Ritm de câștig',
        stat_peak_inc: 'Vârf Încasare',
        stat_avg_ticket: 'Coș Mediu Bon',
        stat_runway: 'Autonomie',
        stat_activity_vol: 'Volum & Activitate Tranzacții',
        stat_cashflow_title: 'Evoluție Cashflow & Trend Financiar',
        stat_cashflow_sub: 'Comparație Venituri vs Cheltuieli',
        stat_top_categories_title: 'Ponderea Cheltuielilor pe Categorii',
        stat_top_categories_sub: 'Clasament după valoare și procent din buget',
        stat_weekday_title: 'Distribuție pe Zilele Săptămânii',
        stat_weekday_sub: 'Comportament de cheltuire: Luni – Duminică',
        stat_hourly_title: 'Distribuție pe Interval Orar',
        stat_hourly_sub: 'Orele de vârf ale cheltuielilor (00:00 – 23:00)',
        stat_month_days_title: 'Distribuție pe Zilele Lunii',
        stat_month_days_sub: 'Comportament de cheltuire: Zilele 1 – 31',
        stat_table_title: 'Raport Sintetic Financiar (P&L)',
        stat_table_sub: 'Situație cronologică a veniturilor, cheltuielilor și soldului',
        th_period: 'Perioadă',
        th_income: 'Venituri',
        th_expense: 'Cheltuieli',
        th_net: 'Sold Net',
        th_rate: 'Rată',
        popover_header_title: '🛍️ Cumpărături | 🛒 Magazine',
        prompt_placeholder_name: 'Introdu denumirea...',
        pay_method_card: 'Card',
        pay_method_cash: 'Cash',
        btn_merchant_config: '⚙️ Magazine',
        merchant_config_title: 'Setări Listă Magazine',
        merchant_config_sub: 'Bifați categoriile pentru care doriți să apară în dreapta lista verticală cu magazinele și furnizorii folosiți:',
        merchant_custom_title: '🛒 Magazine Personalizate Adăugate:',
        btn_done_save: 'Gata / Salvează',
        merchant_modal_title: 'Analiză Magazine & Coș Mâncare',
        merchant_modal_sub: 'Comparație cheltuieli, pondere și bon mediu pe supermarketuri',
        merchant_kpi_total_food: '💰 TOTAL MÂNCARE',
        merchant_kpi_total_sub: 'Buget alocat',
        merchant_kpi_top_store: '🏬 TOP MAGAZIN',
        merchant_kpi_top_sub: 'Ponderea #1',
        merchant_kpi_avg_ticket: '🧾 COȘ MEDIU BON',
        merchant_kpi_avg_sub: 'Medie per achiziție',
        merchant_kpi_freq_visits: '🛍️ FRECVENȚĂ VIZITE',
        merchant_kpi_freq_sub: 'Ritm cumpărături',
        merchant_chart_title: '📊 Distribuție Procentuală pe Magazine',
        merchant_ranking_title: '🏆 Clasament & Coș Mediu per Magazin',
        merchant_ranking_sub: 'Sume & Pondere',
        merchant_all_receipts_trigger: 'Toate bonurile coș mâncare',
        merchant_click_to_view_all: 'Apasă pentru afișare completă',
        merchant_stores_suffix: 'Magazine',
        merchant_receipts_suffix: 'Bonuri',
        merchant_receipts_analyzed: 'bonuri analizate',
        merchant_visited_suffix: 'magazine vizitate',
        merchant_of_food_budget: 'din bugetul de mâncare',
        merchant_no_purchases: 'Nu au fost găsite cumpărături înregistrate în această perioadă.',
        food_basket_title: 'Bonuri Coș Mâncare',
        food_basket_total_val: '💰 Valoare Totală Bonuri Mâncare',
        food_basket_search_placeholder: 'Caută în bonuri (magazin, descriere)...',
        food_basket_show_all: 'Arată Toate',
        food_basket_filtered: 'Filtrat',
        food_basket_empty: 'Niciun bon găsit conform filtrelor aplicate.',
        transfer_modal_title: 'Transfer Intern (Card ⇄ Cash)',
        transfer_lbl_direction: 'DIRECȚIE TRANSFER',
        transfer_card_to_cash: 'Card ➔ Cash (ATM)',
        transfer_cash_to_card: 'Cash ➔ Card (Depunere)',
        transfer_placeholder_desc: 'Descriere opțională (Ex: Retragere ATM, Depunere)',
        transfer_btn_save: 'Salvează Transferul',
        filter_tx_modal_title: 'Filtrează Tranzacțiile',
        filter_all_tx_title: 'Toate Tranzacțiile',
        filter_all_tx_desc: 'Cheltuieli, venituri și transferuri',
        filter_expenses_tx_title: 'Doar Cheltuieli',
        filter_expenses_tx_desc: 'Plăți și cumpărături efectuate',
        filter_incomes_tx_title: 'Doar Venituri',
        filter_incomes_tx_desc: 'Salarii și încasări adăugate',
        filter_transfers_tx_title: 'Transferuri Interne',
        filter_transfers_tx_desc: 'Mutați bani între Card și Cash',
        filter_period_modal_title: 'Perioadă Afișare Grafic',
        filter_period_current_month_desc: 'Cheltuielile efectuate în luna curentă',
        filter_period_last_month_desc: 'Cheltuielile din luna anterioară',
        filter_period_current_year_desc: 'Toate cheltuielile din anul curent',
        filter_period_all_desc: 'Istoric complet de la începutul utilizării',
        export_header_categories: 'MONEYAPP - CATEGORII',
        export_lbl_period: 'Perioada',
        export_lbl_date: 'Data raport',
        export_lbl_of_total: 'din total',
        export_lbl_tx_history: 'Istoric Tranzacții',
        export_lbl_generated: 'Generat din',
        export_btn: 'Export',
        fund_curr_modal_title: 'Monedă Conversie Fond',
        fund_curr_modal_desc: 'Alege moneda în care vrei să fie afișată conversia fondului disponibil lângă titlu:',
        fund_curr_none: 'Fără conversie',
        fund_curr_none_desc: 'Nu afișa sumă convertită lângă titlu',
        badge_active: 'Activ',
        toast_fund_curr_disabled: 'Conversia fondului a fost dezactivată',
        toast_fund_curr_set: 'Conversia fondului setată în',
        totals_modal_title: 'Total Venituri & Cheltuieli',
        totals_modal_desc: 'Sumarul general al tuturor veniturilor și cheltuielilor înregistrate:',
        totals_card_income: 'Total Venituri',
        totals_card_expense: 'Total Cheltuieli',
        totals_card_net_balance: 'Fond Disponibil Net',
        totals_card_savings_rate: 'Rată Economisire & Activitate',
        totals_card_tx_count: 'tranzacții active',
        lbl_suspend_tx_short: '⏸️ Suspendă',
        btn_scan_receipt: 'Scanează',
        scanner_modal_title: 'Scaner Bonuri & Facturi',
        scanner_status_ready: 'Îndreaptă camera spre bon sau cod QR',
        scanner_status_scanning: 'Se analizează bonul / codul...',
        scanner_status_detected: '✅ Date recunoscute cu succes!',
        scanner_btn_upload_photo: 'Încarcă Poză / Galerie',
        scanner_btn_capture: 'Analizează Bonul',
        scanner_btn_live_cam: 'Live',
        scanner_result_title: 'Date Detectate Automat',
        scanner_lbl_merchant: 'Magazin / Furnizor',
        scanner_lbl_amount: 'Sumă Totală',
        scanner_lbl_category: 'Categorie Atribuită',
        scanner_lbl_payment_date: 'Plată & Dată',
        scanner_btn_rescan: '🔄 Rescanează',
        scanner_btn_apply: '✅ Aplică în Cheltuială',
        scanner_err_camera: 'Nu s-a putut accesa camera. Puteți încărca o fotografie a bonului.',
        scanner_err_no_data: 'Nu s-au putut extrage date clare. Încercați o fotografie mai clară sau introduceți manual.',
        stat_bills_title: 'Facturi & Utilități',
        bills_modal_title: 'Analiză Facturi & Utilități',
        bills_modal_sub: 'Evoluție lunară pe tipuri de facturi, tendințe și costuri anuale',
        bills_kpi_total: '⚡ TOTAL FACTURI',
        bills_kpi_total_sub: 'În perioada selectată',
        bills_kpi_avg: '📅 MEDIE LUNARĂ',
        bills_kpi_avg_sub: 'Ritm mediu utilități',
        bills_kpi_peak: '🔥 VÂRF FACTURĂ',
        bills_kpi_share: '📊 PONDERE BUGET',
        bills_kpi_share_sub: 'din cheltuieli totale',
        bills_chart_title: 'Evoluție Lunară pe Tipuri de Facturi',
        bills_breakdown_title: '⚡ Tipuri de Facturi & Furnizori',
        bills_history_title: '📋 Istoric Plăți Facturi',
        bills_empty: 'Nu există plăți de facturi înregistrate în această perioadă.'
    },
    en: {
        currency_label: 'Currency',
        tab_overview: 'Dashboard',
        tab_overview_full: 'Overview Dashboard',
        tab_transactions: 'Transactions',
        tab_transactions_full: 'Transactions (History)',
        tab_stats: 'Statistics',
        tab_stats_full: 'Statistics',
        tab_categories: 'Categories',
        tab_categories_full: 'Categories',
        balance_title: 'Current Available Balance',
        total_expenses: 'Total Expenses',
        total_income: 'Total Income',
        btn_expense: 'Expense',
        btn_income: 'Income',
        expenses_by_cat: 'Categories',
        total_month: 'Monthly Total',
        categories_list_title: 'Categories & Expenses Breakdown',
        period_current_month: 'This Month',
        period_last_month: 'Last Month',
        period_current_year: 'This Year',
        period_all: 'All Time',
        qr_title: 'Connect Another Phone',
        qr_desc: 'Scan QR or install app',
        btn_open_qr: 'Open QR',
        btn_install_guide: 'Install Guide',
        modal_add_expense: 'Add Expense',
        modal_edit_expense: 'Edit Expense',
        modal_add_income: 'Add Income',
        modal_edit_income: 'Edit Income',
        lbl_amount: 'Amount',
        lbl_date: 'Date',
        lbl_category: 'Choose Category',
        lbl_note: 'Description / Note (optional)',
        lbl_income_source: 'Income Source / Note',
        placeholder_amount: 'Amount (Ex: 45.50)',
        placeholder_desc: 'Ex: Shopping, Fuel',
        placeholder_article: 'Article',
        placeholder_store: 'Store',
        placeholder_add_merchant: '+ New store...',
        placeholder_income_amount: 'Income (Ex: 3500)',
        placeholder_income_source: 'Ex: Salary, Advance, Bonus, Rent',
        lbl_suspend_tx: '⏸️ Suspend transaction (exclude from calculations)',
        suspended_tx_title: 'Suspended Transactions',
        suspended_tx_desc: 'These transactions are temporarily excluded from calculations. You can reactivate, edit or delete them anytime.',
        no_suspended_tx: 'No suspended transactions found.',
        btn_save: 'Save',
        btn_cancel: 'Cancel',
        history_title: 'Transaction History',
        search_placeholder: 'Search description or category...',
        filter_all: 'All',
        filter_expenses: 'Expenses',
        filter_incomes: 'Income',
        reports_title: 'Reports & Statistics',
        annual_income: 'Annual Income',
        annual_expenses: 'Annual Expenses',
        net_savings: 'Net Savings',
        savings_rate: 'Savings Rate',
        monthly_evolution: 'Monthly Trends (Income vs Expenses)',
        categories_title: 'Expense Categories',
        btn_new_category: '+ New Category',
        categories_desc: 'You can create custom categories, each with its own icon and color.',
        no_expenses: 'No Expenses',
        ops_suffix: 'tx',
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        year_prefix: 'Year',
        backup_title: 'Backup & Restore Data',
        backup_desc: 'The backup includes all your data: transactions, custom categories, settings, and UI theme (Dark/Light). When imported, the entire app is restored identically.',
        btn_export_data: 'Export Data (Download Backup file)',
        btn_import_data: 'Import Data (Upload Backup file)',
        btn_close: 'Close',
        conv_title: 'Currency Converter & Rates',
        conv_active_label: 'Default Active Currency:',
        conv_amount_label: 'Amount to convert to other currencies:',
        conv_use_balance: '💰 Current Balance',
        conv_results_title: 'Conversion into other currencies:',
        conv_adjust_rate: '⚙️ Adjust Euro Reference Rate (EUR/RON)',
        conv_save_rate: 'Save Euro Rate',
        conv_active_count: 'active currencies',
        conv_status_title: 'Official Live Rates (ECB)',
        conv_btn_refresh: 'Refresh',
        rates_updated_toast: 'Exchange rates updated successfully!',
        rates_offline_toast: 'Offline mode: using last saved rates.',
        rates_updated_at: 'Updated',
        guide_modal_title: 'How to add MoneyApp to Browser & Phone',
        guide_step1: '<strong>On Android Phone (Google Chrome):</strong><br>Open the app link in Chrome, tap the <strong>3 vertical dots (⋮)</strong> in the top-right corner, and select <strong>"Add to Home screen"</strong> (or "Install app").',
        guide_step2: '<strong>On iPhone / iPad (Safari):</strong><br>Open the page in Safari, tap the <strong>Share button (square with arrow up)</strong> at the bottom, scroll down, and select <strong>"Add to Home Screen"</strong>.',
        guide_step3: '<strong>On Computer (Google Chrome / Edge):</strong><br>Click the install icon in the address bar (right) or press <strong>Ctrl + D</strong> to add a Bookmark directly to your bookmarks bar.',
        guide_step4: '<strong>Or direct download as Android app (APK):</strong><br>You can download the APK installer file to install directly or share via WhatsApp.',
        guide_btn_apk: 'Download MoneyApp.apk file',
        guide_btn_gotit: 'Got it',
        qr_modal_title: '📱 Connect Phone',
        qr_modal_desc: 'To open the app on your phone, scan the QR code below:',
        qr_step1: 'Open the <strong>Camera</strong> app on your phone.',
        qr_step2: 'Point the camera at the <strong>QR code above</strong>.',
        qr_step3: 'Tap the <strong>link pop-up</strong> on the screen to open MoneyApp in your <strong>Browser</strong>!',
        qr_btn_copy: 'Copy',
        btn_download_apk: 'Download MoneyApp_v3.3.55.apk',
        link_copied: 'Link copied to clipboard!',
        lbl_selected_period: 'Selected Period',
        lbl_total_spent: 'Total Spent',
        lbl_of_period_expenses: 'of period expenses',
        lbl_category_transactions: 'Transactions in this category:',
        btn_close_to_chart: 'Close and return to chart',
        empty_category_expenses: 'No expenses in this category for the selected period.',
        modal_add_category: 'Add New Category',
        modal_edit_category: 'Edit Category',
        lbl_category_name: 'Category Name *',
        placeholder_category_name: 'Ex: Pharmacy, Gifts, Fuel',
        lbl_category_icon: 'Icon / Emoji',
        lbl_category_color: 'Category Color *',
        lbl_recommended_colors: 'Recommended quick colors:',
        btn_save_category: 'Save Category',
        lbl_registered_expenses: 'recorded expenses',
        export_btn_copy: '📋 Copy',
        export_btn_whatsapp: '💬 WhatsApp',
        export_btn_print: '🖨️ PDF',
        export_btn_download: '💾 .txt',
        export_copied_toast: 'Text copied to clipboard!',
        export_downloaded_toast: 'File downloaded successfully!',
        currency_modal_title: 'Choose Main Currency',
        currency_modal_desc: 'Select the currency in which <strong>MoneyApp</strong> should operate. All data, balance, expenses, income and charts will be automatically recalculated and displayed in the chosen currency.',
        currency_ref_label: 'Reference Currency',
        currency_active_badge: '✓ Active',
        stat_dashboard_sub: 'Financial Dashboard & Cashflow Analysis',
        stat_pill_month: 'This Month',
        stat_pill_3months: '3 Months',
        stat_pill_year: 'Current Year',
        stat_pill_all: 'All Time',
        stat_income: 'Income',
        stat_expense: 'Expenses',
        stat_daily_avg: 'Daily Expenses',
        stat_daily_sub: 'Spending pace',
        stat_peak_exp: 'Peak Expense',
        stat_daily_income: 'Daily Income',
        stat_income_pace: 'Earning pace',
        stat_peak_inc: 'Peak Income',
        stat_avg_ticket: 'Average Ticket',
        stat_runway: 'Runway',
        stat_activity_vol: 'Transaction Volume & Activity',
        stat_cashflow_title: 'Cashflow Evolution & Financial Trend',
        stat_cashflow_sub: 'Income vs Expenses comparison',
        stat_top_categories_title: 'Expense Share by Category',
        stat_top_categories_sub: 'Ranked by value and budget share',
        stat_weekday_title: 'Weekday Spending Distribution',
        stat_weekday_sub: 'Spending pattern: Monday – Sunday',
        stat_hourly_title: 'Hourly Spending Distribution',
        stat_hourly_sub: 'Peak spending hours (00:00 – 23:00)',
        stat_month_days_title: 'Monthly Days Distribution',
        stat_month_days_sub: 'Spending pattern: Days 1 – 31',
        stat_table_title: 'Financial Summary Report (P&L)',
        stat_table_sub: 'Chronological income, expenses & net cashflow',
        th_period: 'Period',
        th_income: 'Income',
        th_expense: 'Expenses',
        th_net: 'Net Cashflow',
        th_rate: 'Rate',
        popover_header_title: '🛍️ Shopping Items | 🛒 Stores',
        prompt_placeholder_name: 'Enter name...',
        pay_method_card: 'Card',
        pay_method_cash: 'Cash',
        btn_merchant_config: '⚙️ Stores',
        merchant_config_title: 'Store List Settings',
        merchant_config_sub: 'Check the categories for which you want the store and vendor list to appear on the right:',
        merchant_custom_title: '🛒 Custom Added Stores:',
        btn_done_save: 'Done / Save',
        merchant_modal_title: 'Store Analysis & Food Basket',
        merchant_modal_sub: 'Expense comparison, market share and average ticket across stores',
        merchant_kpi_total_food: '💰 TOTAL FOOD',
        merchant_kpi_total_sub: 'Allocated budget',
        merchant_kpi_top_store: '🏬 TOP STORE',
        merchant_kpi_top_sub: '#1 Share',
        merchant_kpi_avg_ticket: '🧾 AVG TICKET',
        merchant_kpi_avg_sub: 'Average per purchase',
        merchant_kpi_freq_visits: '🛍️ VISIT FREQUENCY',
        merchant_kpi_freq_sub: 'Shopping rhythm',
        merchant_chart_title: '📊 Percentage Breakdown by Store',
        merchant_ranking_title: '🏆 Ranking & Avg Ticket by Store',
        merchant_ranking_sub: 'Amounts & Share',
        merchant_all_receipts_trigger: 'All food basket receipts',
        merchant_click_to_view_all: 'Tap to view full list',
        merchant_stores_suffix: 'Stores',
        merchant_receipts_suffix: 'Receipts',
        merchant_receipts_analyzed: 'receipts analyzed',
        merchant_visited_suffix: 'stores visited',
        merchant_of_food_budget: 'of food budget',
        merchant_no_purchases: 'No purchases found for this period.',
        food_basket_title: 'Food Basket Receipts',
        food_basket_total_val: '💰 Total Food Receipts Value',
        food_basket_search_placeholder: 'Search receipts (store, description)...',
        food_basket_show_all: 'Show All',
        food_basket_filtered: 'Filtered',
        food_basket_empty: 'No receipts found matching the applied filters.',
        transfer_modal_title: 'Internal Transfer (Card ⇄ Cash)',
        transfer_lbl_direction: 'TRANSFER DIRECTION',
        transfer_card_to_cash: 'Card ➔ Cash (ATM)',
        transfer_cash_to_card: 'Cash ➔ Card (Deposit)',
        transfer_placeholder_desc: 'Optional description (Ex: ATM withdrawal, Deposit)',
        transfer_btn_save: 'Save Transfer',
        filter_tx_modal_title: 'Filter Transactions',
        filter_all_tx_title: 'All Transactions',
        filter_all_tx_desc: 'Expenses, income and transfers',
        filter_expenses_tx_title: 'Expenses Only',
        filter_expenses_tx_desc: 'Payments and purchases made',
        filter_incomes_tx_title: 'Income Only',
        filter_incomes_tx_desc: 'Salaries and income added',
        filter_transfers_tx_title: 'Internal Transfers',
        filter_transfers_tx_desc: 'Move money between Card and Cash',
        filter_period_modal_title: 'Chart Display Period',
        filter_period_current_month_desc: 'Expenses made in the current month',
        filter_period_last_month_desc: 'Expenses from the previous month',
        filter_period_current_year_desc: 'All expenses from the current year',
        filter_period_all_desc: 'Complete history since start of use',
        export_header_categories: 'MONEYAPP - CATEGORIES',
        export_lbl_period: 'Period',
        export_lbl_date: 'Report date',
        export_lbl_of_total: 'of total',
        export_lbl_tx_history: 'Transaction History',
        export_lbl_generated: 'Generated from',
        export_btn: 'Export',
        fund_curr_modal_title: 'Fund Conversion Currency',
        fund_curr_modal_desc: 'Choose the currency to display the converted available fund next to the title:',
        fund_curr_none: 'No conversion',
        fund_curr_none_desc: 'Do not show converted amount next to title',
        badge_active: 'Active',
        toast_fund_curr_disabled: 'Fund conversion has been disabled',
        toast_fund_curr_set: 'Fund conversion set to',
        totals_modal_title: 'Total Income & Expenses',
        totals_modal_desc: 'General summary of all recorded income and expenses:',
        totals_card_income: 'Total Income',
        totals_card_expense: 'Total Expenses',
        totals_card_net_balance: 'Net Available Fund',
        totals_card_savings_rate: 'Savings Rate & Activity',
        totals_card_tx_count: 'active transactions',
        lbl_suspend_tx_short: '⏸️ Suspend',
        btn_scan_receipt: 'Scan',
        scanner_modal_title: 'Receipt & Bill Scanner',
        scanner_status_ready: 'Point camera at receipt or QR code',
        scanner_status_scanning: 'Analyzing receipt / code...',
        scanner_status_detected: '✅ Data successfully recognized!',
        scanner_btn_upload_photo: 'Upload Photo / Gallery',
        scanner_btn_capture: 'Analyze Receipt',
        scanner_btn_live_cam: 'Live',
        scanner_result_title: 'Automatically Detected Data',
        scanner_lbl_merchant: 'Store / Provider',
        scanner_lbl_amount: 'Total Amount',
        scanner_lbl_category: 'Assigned Category',
        scanner_lbl_payment_date: 'Payment & Date',
        scanner_btn_rescan: '🔄 Rescan',
        scanner_btn_apply: '✅ Apply to Expense',
        scanner_err_camera: 'Could not access camera. You can upload a photo of the receipt.',
        scanner_err_no_data: 'Could not extract clear data. Try a clearer photo or enter manually.',
        stat_bills_title: 'Bills & Utilities',
        bills_modal_title: 'Bills & Utilities Analysis',
        bills_modal_sub: 'Monthly trend by bill type, patterns and annual costs',
        bills_kpi_total: '⚡ TOTAL BILLS',
        bills_kpi_total_sub: 'In selected period',
        bills_kpi_avg: '📅 MONTHLY AVG',
        bills_kpi_avg_sub: 'Average utilities pace',
        bills_kpi_peak: '🔥 PEAK BILL',
        bills_kpi_share: '📊 BUDGET SHARE',
        bills_kpi_share_sub: 'of total expenses',
        bills_chart_title: 'Monthly Trend by Bill Type',
        bills_breakdown_title: '⚡ Bill Types & Providers',
        bills_history_title: '📋 Bill Payment History',
        bills_empty: 'No bill payments recorded in this period.'
    },
    de: {
        currency_label: 'Währung',
        tab_overview: 'Übersicht',
        tab_overview_full: 'Hauptübersicht',
        tab_transactions: 'Transaktionen',
        tab_transactions_full: 'Transaktionen (Verlauf)',
        tab_stats: 'Statistiken',
        tab_stats_full: 'Statistiken',
        tab_categories: 'Kategorien',
        tab_categories_full: 'Kategorien',
        balance_title: 'Aktuelles Guthaben',
        total_expenses: 'Gesamtausgaben',
        total_income: 'Gesamteinnahmen',
        btn_expense: 'Ausgabe',
        btn_income: 'Einnahme',
        expenses_by_cat: 'Ausgaben nach Kategorie',
        total_month: 'Monatssumme',
        categories_list_title: 'Kategorien- & Ausgabenübersicht',
        period_current_month: 'Dieser Monat',
        period_last_month: 'Letzter Monat',
        period_current_year: 'Dieses Jahr',
        period_all: 'Gesamter Zeitraum',
        qr_title: 'Mit Telefon verbinden',
        qr_desc: 'QR scannen oder installieren',
        btn_open_qr: 'QR öffnen',
        btn_install_guide: 'Installationsanleitung',
        modal_add_expense: 'Ausgabe hinzufügen',
        modal_edit_expense: 'Ausgabe bearbeiten',
        modal_add_income: 'Einnahme hinzufügen',
        modal_edit_income: 'Einnahme bearbeiten',
        lbl_amount: 'Betrag',
        lbl_date: 'Datum',
        lbl_category: 'Kategorie wählen',
        lbl_note: 'Beschreibung / Notiz (optional)',
        lbl_income_source: 'Einnahmequelle / Notiz',
        placeholder_amount: 'Betrag (Z.B.: 45.50)',
        placeholder_desc: 'Z.B.: Einkaufen, Kraftstoff',
        placeholder_article: 'Artikel',
        placeholder_store: 'Geschäft',
        placeholder_add_merchant: '+ Neues Geschäft...',
        placeholder_income_amount: 'Einkommen (Z.B.: 3500)',
        placeholder_income_source: 'Z.B.: Gehalt, Vorschuss, Bonus, Miete',
        lbl_suspend_tx: '⏸️ Transaktion aussetzen (vorübergehend ausschließen)',
        suspended_tx_title: 'Pausierte Transaktionen',
        suspended_tx_desc: 'Diese Transaktionen sind vorübergehend von den Berechnungen ausgeschlossen. Sie können sie jederzeit reaktivieren, bearbeiten oder löschen.',
        no_suspended_tx: 'Keine pausierten Transaktionen vorhanden.',
        btn_save: 'Speichern',
        btn_cancel: 'Abbrechen',
        history_title: 'Transaktionsverlauf',
        search_placeholder: 'Nach Beschreibung suchen...',
        filter_all: 'Alle',
        filter_expenses: 'Ausgaben',
        filter_incomes: 'Einnahmen',
        reports_title: 'Berichte & Statistiken',
        annual_income: 'Jahreseinnahmen',
        annual_expenses: 'Jahresausgaben',
        net_savings: 'Nettoersparnis',
        savings_rate: 'Sparquote',
        monthly_evolution: 'Monatlicher Verlauf (Einnahmen vs Ausgaben)',
        categories_title: 'Ausgabenkategorien',
        btn_new_category: '+ Neue Kategorie',
        categories_desc: 'Fügen Sie beliebig viele Kategorien mit eigenen Farben und Symbolen hinzu.',
        no_expenses: 'Keine Ausgaben',
        ops_suffix: 'Vorg.',
        months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
        year_prefix: 'Jahr',
        backup_title: 'Datensicherung & Wiederherstellung',
        backup_desc: 'Das Backup enthält alle Ihre Daten: Transaktionen, benutzerdefinierte Kategorien, Einstellungen und Oberflächendesign. Beim Import wird die App identisch wiederhergestellt.',
        btn_export_data: 'Daten exportieren (Backup-Datei)',
        btn_import_data: 'Daten importieren (Backup-Datei)',
        btn_close: 'Schließen',
        conv_title: 'Währungsrechner & Wechselkurse',
        conv_active_label: 'Aktive Währung:',
        conv_amount_label: 'Umzurechnender Betrag in andere Währungen:',
        conv_use_balance: '💰 Aktuelles Guthaben',
        conv_results_title: 'Umrechnung in andere Währungen:',
        conv_adjust_rate: '⚙️ Euro-Referenzkurs anpassen (EUR/RON)',
        conv_save_rate: 'Euro-Kurs speichern',
        conv_active_count: 'aktive Währungen',
        conv_status_title: 'Offizielle Live-Kurse (EZB)',
        conv_btn_refresh: 'Aktualisieren',
        rates_updated_toast: 'Wechselkurse erfolgreich aktualisiert!',
        rates_offline_toast: 'Offline-Modus: Zuletzt gespeicherte Kurse verwendet.',
        rates_updated_at: 'Aktualisiert',
        guide_modal_title: 'MoneyApp auf Browser & Telefon installieren',
        guide_step1: '<strong>Auf Android-Geräten (Chrome):</strong><br>Link in Chrome öffnen, auf die <strong>3 Punkte (⋮)</strong> oben rechts tippen und <strong>„Zum Startbildschirm hinzufügen”</strong> wählen.',
        guide_step2: '<strong>Auf iPhone / iPad (Safari):</strong><br>Seite in Safari öffnen, auf <strong>Teilen (Quadrat mit Pfeil nach oben)</strong> tippen und <strong>„Zum Home-Bildschirm”</strong> wählen.',
        guide_step3: '<strong>Auf dem PC (Chrome / Edge):</strong><br>Auf das Installationssymbol in der Adressleiste klicken oder <strong>Strg + D</strong> drücken für ein Lesezeichen.',
        guide_step4: '<strong>Oder direkter Android-Download (APK):</strong><br>Installationsdatei direkt herunterladen und per WhatsApp teilen.',
        guide_btn_apk: 'MoneyApp.apk herunterladen',
        guide_btn_gotit: 'Verstanden',
        qr_modal_title: '📱 Telefon verbinden',
        qr_modal_desc: 'Um die App auf Ihrem Telefon zu öffnen, scannen Sie den QR-Code:',
        qr_step1: 'Öffnen Sie die <strong>Kamera-App</strong> auf Ihrem Telefon.',
        qr_step2: 'Richten Sie die Kamera auf den <strong>obigen QR-Code</strong>.',
        qr_step3: 'Tippen Sie auf den <strong>angezeigten Link</strong>, um MoneyApp im <strong>Browser</strong> zu öffnen!',
        qr_btn_copy: 'Kopieren',
        btn_download_apk: 'MoneyApp_v3.3.55.apk herunterladen',
        link_copied: 'Link in Zwischenablage kopiert!',
        lbl_selected_period: 'Ausgewählter Zeitraum',
        lbl_total_spent: 'Gesamtausgaben',
        lbl_of_period_expenses: 'der Periodenausgaben',
        lbl_category_transactions: 'Transaktionen in dieser Kategorie:',
        btn_close_to_chart: 'Schließen und zum Diagramm',
        empty_category_expenses: 'Keine Ausgaben in dieser Kategorie für den ausgewählten Zeitraum.',
        modal_add_category: 'Neue Kategorie hinzufügen',
        modal_edit_category: 'Kategorie bearbeiten',
        lbl_category_name: 'Kategoriename *',
        placeholder_category_name: 'Z.B.: Apotheke, Geschenke, Kraftstoff',
        lbl_category_icon: 'Symbol / Emoji',
        lbl_category_color: 'Kategoriefarbe *',
        lbl_recommended_colors: 'Empfohlene Schnellfarben:',
        btn_save_category: 'Kategorie speichern',
        lbl_registered_expenses: 'registrierte Ausgaben',
        currency_modal_title: 'Hauptwährung Wählen',
        currency_modal_desc: 'Wählen Sie die Währung, in der <strong>MoneyApp</strong> operieren soll. Alle Daten, Salden, Ausgaben, Einnahmen und Diagramme werden automatisch neu berechnet.',
        currency_ref_label: 'Referenzwährung',
        currency_active_badge: '✓ Aktiv',
        stat_dashboard_sub: 'Finanz-Dashboard & Cashflow-Analyse',
        stat_pill_month: 'Dieser Monat',
        stat_pill_3months: '3 Monate',
        stat_pill_year: 'Aktuelles Jahr',
        stat_pill_all: 'Gesamt',
        stat_income: 'Einnahmen',
        stat_expense: 'Ausgaben',
        stat_daily_avg: 'Tagesausgaben',
        stat_daily_sub: 'Ausgabenrate',
        stat_peak_exp: 'Höchste Ausgabe',
        stat_daily_income: 'Tageseinnahmen',
        stat_income_pace: 'Einnahmenrate',
        stat_peak_inc: 'Höchste Einnahme',
        stat_avg_ticket: 'Ø Bon-Betrag',
        stat_runway: 'Reichweite',
        stat_activity_vol: 'Transaktionsvolumen & Aktivität',
        stat_cashflow_title: 'Cashflow-Entwicklung & Trend',
        stat_cashflow_sub: 'Vergleich Einnahmen vs. Ausgaben',
        stat_top_categories_title: 'Ausgaben nach Kategorien',
        stat_top_categories_sub: 'Rangliste nach Wert und Budgetanteil',
        stat_weekday_title: 'Verteilung nach Wochentagen',
        stat_weekday_sub: 'Ausgabemuster: Montag – Sonntag',
        stat_hourly_title: 'Stündliche Ausgabenverteilung',
        stat_hourly_sub: 'Spitzenzeiten für Ausgaben (00:00 – 23:00)',
        stat_month_days_title: 'Verteilung nach Monatstagen',
        stat_month_days_sub: 'Ausgabemuster: Tage 1 – 31',
        stat_table_title: 'Finanzübersichtsbericht (P&L)',
        stat_table_sub: 'Chronologische Aufstellung von Einnahmen und Ausgaben',
        th_period: 'Zeitraum',
        th_income: 'Einnahmen',
        th_expense: 'Ausgaben',
        th_net: 'Netto-Saldo',
        th_rate: 'Quote',
        popover_header_title: '🛍️ Artikel | 🛒 Geschäfte',
        prompt_placeholder_name: 'Namen eingeben...',
        pay_method_card: 'Karte',
        pay_method_cash: 'Bargeld',
        btn_merchant_config: '⚙️ Geschäfte',
        merchant_config_title: 'Geschäftsliste Einstellungen',
        merchant_config_sub: 'Wählen Sie die Kategorien aus, für die rechts die Liste der Geschäfte und Händler angezeigt werden soll:',
        merchant_custom_title: '🛒 Benutzerdefinierte Geschäfte:',
        btn_done_save: 'Fertig / Speichern',
        merchant_modal_title: 'Geschäftsanalyse & Warenkorb',
        merchant_modal_sub: 'Ausgabenvergleich, Marktanteil und Durchschnittsbon nach Geschäften',
        merchant_kpi_total_food: '💰 GESAMT LEBENSMITTEL',
        merchant_kpi_total_sub: 'Zugewiesenes Budget',
        merchant_kpi_top_store: '🏬 TOP GESCHÄFT',
        merchant_kpi_top_sub: '#1 Anteil',
        merchant_kpi_avg_ticket: '🧾 Ø BON-BETRAG',
        merchant_kpi_avg_sub: 'Durchschnitt pro Einkauf',
        merchant_kpi_freq_visits: '🛍️ BESUCHSFREQUENZ',
        merchant_kpi_freq_sub: 'Einkaufsrhythmus',
        merchant_chart_title: '📊 Prozentuale Verteilung nach Geschäften',
        merchant_ranking_title: '🏆 Rangliste & Ø Bon nach Geschäft',
        merchant_ranking_sub: 'Beträge & Anteil',
        merchant_all_receipts_trigger: 'Alle Lebensmittelbelege',
        merchant_click_to_view_all: 'Tippen für vollständige Ansicht',
        merchant_stores_suffix: 'Geschäfte',
        merchant_receipts_suffix: 'Belege',
        merchant_receipts_analyzed: 'analysierte Belege',
        merchant_visited_suffix: 'besuchte Geschäfte',
        merchant_of_food_budget: 'des Lebensmittelbudgets',
        merchant_no_purchases: 'Keine Einkäufe in diesem Zeitraum gefunden.',
        food_basket_title: 'Lebensmittelbelege',
        food_basket_total_val: '💰 Gesamtwert Lebensmittelbelege',
        food_basket_search_placeholder: 'In Belegen suchen (Geschäft, Beschreibung)...',
        food_basket_show_all: 'Alle anzeigen',
        food_basket_filtered: 'Gefiltert',
        food_basket_empty: 'Keine Belege gefunden, die den Filtern entsprechen.',
        transfer_modal_title: 'Interner Transfer (Karte ⇄ Bargeld)',
        transfer_lbl_direction: 'TRANSFERRICHTUNG',
        transfer_card_to_cash: 'Karte ➔ Bargeld (Geldautomat)',
        transfer_cash_to_card: 'Bargeld ➔ Karte (Einzahlung)',
        transfer_placeholder_desc: 'Optionale Beschreibung (Z.B.: ATM-Abhebung, Einzahlung)',
        transfer_btn_save: 'Transfer speichern',
        filter_tx_modal_title: 'Transaktionen filtern',
        filter_all_tx_title: 'Alle Transaktionen',
        filter_all_tx_desc: 'Ausgaben, Einnahmen und Transfers',
        filter_expenses_tx_title: 'Nur Ausgaben',
        filter_expenses_tx_desc: 'Getätigte Zahlungen und Einkäufe',
        filter_incomes_tx_title: 'Nur Einnahmen',
        filter_incomes_tx_desc: 'Gehälter und hinzugefügte Einnahmen',
        filter_transfers_tx_title: 'Interne Transfers',
        filter_transfers_tx_desc: 'Geld zwischen Karte und Bargeld verschieben',
        filter_period_modal_title: 'Diagramm-Zeitraum',
        filter_period_current_month_desc: 'Ausgaben im aktuellen Monat',
        filter_period_last_month_desc: 'Ausgaben aus dem Vormonat',
        filter_period_current_year_desc: 'Alle Ausgaben des laufenden Jahres',
        filter_period_all_desc: 'Vollständiger Verlauf seit Beginn',
        export_header_categories: 'MONEYAPP - KATEGORIEN',
        export_lbl_period: 'Zeitraum',
        export_lbl_date: 'Berichtsdatum',
        export_lbl_of_total: 'vom Gesamten',
        export_lbl_tx_history: 'Transaktionsverlauf',
        export_lbl_generated: 'Erstellt von',
        export_btn: 'Exportieren',
        fund_curr_modal_title: 'Währung für Guthaben-Umrechnung',
        fund_curr_modal_desc: 'Wählen Sie die Währung für die Umrechnung des verfügbaren Guthabens neben dem Titel:',
        fund_curr_none: 'Keine Umrechnung',
        fund_curr_none_desc: 'Keinen umgerechneten Betrag neben dem Titel anzeigen',
        badge_active: 'Aktiv',
        toast_fund_curr_disabled: 'Guthaben-Umrechnung wurde deaktiviert',
        toast_fund_curr_set: 'Guthaben-Umrechnung festgelegt auf',
        totals_modal_title: 'Gesamteinnahmen & Gesamtausgaben',
        totals_modal_desc: 'Gesamtübersicht aller erfassten Einnahmen und Ausgaben:',
        totals_card_income: 'Gesamteinnahmen',
        totals_card_expense: 'Gesamtausgaben',
        totals_card_net_balance: 'Netto-Verfügbares Guthaben',
        totals_card_savings_rate: 'Sparquote & Aktivität',
        totals_card_tx_count: 'aktive Transaktionen',
        lbl_suspend_tx_short: '⏸️ Aussetzen',
        btn_scan_receipt: 'Scannen',
        scanner_modal_title: 'Beleg- & Rechnungsscanner',
        scanner_status_ready: 'Kamera auf Beleg oder QR-Code richten',
        scanner_status_scanning: 'Beleg / Code wird analysiert...',
        scanner_status_detected: '✅ Daten erfolgreich erkannt!',
        scanner_btn_upload_photo: 'Foto hochladen / Galerie',
        scanner_btn_live_cam: 'Live',
        scanner_result_title: 'Automatisch erkannte Daten',
        scanner_lbl_merchant: 'Geschäft / Anbieter',
        scanner_lbl_amount: 'Gesamtbetrag',
        scanner_lbl_category: 'Zugewiesene Kategorie',
        scanner_lbl_payment_date: 'Zahlung & Datum',
        scanner_btn_rescan: '🔄 Neu scannen',
        scanner_btn_apply: '✅ In Ausgabe übernehmen',
        scanner_err_camera: 'Kamera nicht erreichbar. Sie können ein Belegfoto hochladen.',
        scanner_err_no_data: 'Keine klaren Daten gefunden. Bitte deutlicheres Foto versuchen.',
        stat_bills_title: 'Rechnungen & Nebenkosten',
        bills_modal_title: 'Rechnungs- & Nebenkostenanalyse',
        bills_modal_sub: 'Monatliche Entwicklung nach Rechnungsart, Trends und Jahreskosten',
        bills_kpi_total: '⚡ GESAMT RECHNUNGEN',
        bills_kpi_total_sub: 'Im ausgewählten Zeitraum',
        bills_kpi_avg: '📅 MONATSDURCHSCHNITT',
        bills_kpi_avg_sub: 'Durchschnittlicher Versorgungsaufwand',
        bills_kpi_peak: '🔥 HÖCHSTE RECHNUNG',
        bills_kpi_share: '📊 BUDGETANTEIL',
        bills_kpi_share_sub: 'der Gesamtausgaben',
        bills_chart_title: 'Monatliche Entwicklung nach Rechnungsart',
        bills_breakdown_title: '⚡ Rechnungsarten & Anbieter',
        bills_history_title: '📋 Rechnungsverlauf',
        bills_empty: 'Keine Rechnungszahlungen in diesem Zeitraum erfasst.'
    },
    tr: {
        currency_label: 'Para Birimi',
        tab_overview: 'Panel',
        tab_overview_full: 'Genel Panel',
        tab_transactions: 'İşlemler',
        tab_transactions_full: 'İşlemler (Geçmiş)',
        tab_stats: 'İstatistikler',
        tab_stats_full: 'İstatistikler',
        tab_categories: 'Kategoriler',
        tab_categories_full: 'Kategoriler',
        balance_title: 'Mevcut Bakiye',
        total_expenses: 'Toplam Gider',
        total_income: 'Toplam Gelir',
        btn_expense: 'Gider',
        btn_income: 'Gelir',
        expenses_by_cat: 'Kategoriye Göre Giderler',
        total_month: 'Aylık Toplam',
        categories_list_title: 'Kategoriler ve Harcama Listesi',
        period_current_month: 'Bu Ay',
        period_last_month: 'Geçen Ay',
        period_current_year: 'Bu Yıl',
        period_all: 'Tüm Zamanlar',
        qr_title: 'Başka Telefona Bağlan',
        qr_desc: 'QR tarayın veya yükleyin',
        btn_open_qr: 'QR Aç',
        btn_install_guide: 'Kurulum Kılavuzu',
        modal_add_expense: 'Gider Ekle',
        modal_edit_expense: 'Gideri Düzenle',
        modal_add_income: 'Gelir Ekle',
        modal_edit_income: 'Geliri Düzenle',
        lbl_amount: 'Tutar',
        lbl_date: 'Tarih',
        lbl_category: 'Kategori Seç',
        lbl_note: 'Açıklama / Not (isteğe bağlı)',
        lbl_income_source: 'Gelir Kaynağı / Açıklama',
        placeholder_amount: 'Tutar (Örn: 45.50)',
        placeholder_desc: 'Örn: Alışveriş, Yakıt',
        placeholder_article: 'Ürün',
        placeholder_store: 'Mağaza',
        placeholder_add_merchant: '+ Yeni mağaza...',
        placeholder_income_amount: 'Gelir (Örn: 3500)',
        placeholder_income_source: 'Örn: Maaş, Avans, Bonus, Kira',
        lbl_suspend_tx: '⏸️ İşlemi askıya al (hesaplamalardan hariç tut)',
        suspended_tx_title: 'Askıya Alınan İşlemler',
        suspended_tx_desc: 'Bu işlemler hesaplamalardan geçici olarak hariç tutulmuştur. İstediğiniz zaman yeniden etkinleştirebilirsiniz.',
        no_suspended_tx: 'Askıya alınan işlem yok.',
        btn_save: 'Kaydet',
        btn_cancel: 'İptal',
        history_title: 'İşlem Geçmişi',
        search_placeholder: 'Açıklama veya kategori ara...',
        filter_all: 'Tümü',
        filter_expenses: 'Giderler',
        filter_incomes: 'Gelirler',
        reports_title: 'Raporlar ve İstatistikler',
        annual_income: 'Yıllık Gelir',
        annual_expenses: 'Yıllık Gider',
        net_savings: 'Net Tasarruf',
        savings_rate: 'Tasarruf Oranı',
        monthly_evolution: 'Aylık Trendler (Gelir vs Gider)',
        categories_title: 'Gider Kategorileri',
        btn_new_category: '+ Yeni Kategori',
        categories_desc: 'Kendi simge ve renginizle özel kategoriler ekleyebilirsiniz.',
        no_expenses: 'Gider Yok',
        ops_suffix: 'işl.',
        months: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
        monthsShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
        year_prefix: 'Yıl',
        backup_title: 'Veri Yedekleme ve Geri Yükleme',
        backup_desc: 'Yedekleme tüm verilerinizi içerir: işlemler, özel kategoriler, ayarlar ve tema. İçe aktarıldığında uygulama birebir geri yüklenir.',
        btn_export_data: 'Verileri Dışa Aktar (Yedek İndir)',
        btn_import_data: 'Verileri İçe Aktar (Yedek Yükle)',
        btn_close: 'Kapat',
        conv_title: 'Döviz Çevirici ve Kurlar',
        conv_active_label: 'Varsayılan Para Birimi:',
        conv_amount_label: 'Diğer para birimlerine dönüştürülecek tutar:',
        conv_use_balance: '💰 Mevcut Bakiye',
        conv_results_title: 'Diğer para birimlerine dönüşüm:',
        conv_adjust_rate: '⚙️ Euro Referans Kurunu Ayarla (EUR/RON)',
        conv_save_rate: 'Euro Kurunu Kaydet',
        conv_active_count: 'aktif para birimi',
        conv_status_title: 'Resmi Canlı Kurlar (ECB)',
        conv_btn_refresh: 'Yenile',
        rates_updated_toast: 'Döviz kurları başarıyla güncellendi!',
        rates_offline_toast: 'Çevrimdışı mod: son kaydedilen kurlar kullanılıyor.',
        rates_updated_at: 'Güncellendi',
        guide_modal_title: 'MoneyApp Tarayıcıya ve Telefona Nasıl Eklenir',
        guide_step1: '<strong>Android Telefonda (Google Chrome):</strong><br>Chrome\'da bağlantıyı açın, sağ üstteki <strong>3 noktaya (⋮)</strong> dokunun ve <strong>"Ana ekrana ekle"</strong> seçeneğini seçin.',
        guide_step2: '<strong>iPhone / iPad\'de (Safari):</strong><br>Safari\'de açın, alttaki <strong>Paylaş</strong> simgesine dokunun ve <strong>"Ana Ekrana Ekle"</strong>yi seçin.',
        btn_confirm_delete: 'Sil',
        qr_scan_title: 'Başka Cihazda MoneyApp Aç',
        qr_scan_desc: 'Bu QR kodunu tarayarak uygulamayı telefonunuzda, tabletinizde veya bilgisayarınızda açabilirsiniz.',
        qr_step1: 'Telefonunuzda <strong>Kamera</strong> uygulamasını açın.',
        qr_step2: 'Kamerayı yukarıdaki <strong>QR koduna</strong> doğrultun.',
        qr_step3: 'MoneyApp\'i <strong>Tarayıcıda</strong> açmak için ekrandaki <strong>bağlantıya</strong> dokunun!',
        qr_btn_copy: 'Kopya',
        btn_download_apk: 'MoneyApp_v3.3.55.apk İndir',
        link_copied: 'Bağlantı panoya kopyalandı!',
        lbl_selected_period: 'Seçilen Dönem',
        lbl_total_spent: 'Toplam Harcama',
        lbl_of_period_expenses: 'dönem harcamalarından',
        btn_close_to_chart: 'Kapat ve grafiğe dön',
        empty_category_expenses: 'Seçilen dönem için bu kategoride harcama bulunamadı.',
        modal_add_category: 'Yeni Kategori Ekle',
        modal_edit_category: 'Kategoriyi Düzenle',
        lbl_category_name: 'Kategori Adı *',
        placeholder_category_name: 'Örn: Eczane, Hediyeler, Yakıt',
        lbl_category_icon: 'Simge / Emoji',
        lbl_category_color: 'Kategori Rengi *',
        lbl_recommended_colors: 'Önerilen hızlı renkler:',
        btn_save_category: 'Kategoriyi Kaydet',
        lbl_registered_expenses: 'kayıtlı harcama',
        currency_modal_title: 'Ana Para Birimini Seçin',
        currency_modal_desc: '<strong>MoneyApp</strong> için ana para birimini seçin. Tüm veriler, bakiye, harcamalar ve grafikler seçilen para biriminde otomatik olarak güncellenecektir.',
        currency_ref_label: 'Referans Para Birimi',
        currency_active_badge: '✓ Aktif',
        stat_dashboard_sub: 'Finansal Kontrol Paneli & Nakit Akışı Analizi',
        stat_pill_month: 'Bu Ay',
        stat_pill_3months: '3 Ay',
        stat_pill_year: 'Bu Yıl',
        stat_pill_all: 'Tümü',
        stat_income: 'Gelirler',
        stat_expense: 'Giderler',
        stat_daily_avg: 'Günlük Gider',
        stat_daily_sub: 'Harcama hızı',
        stat_peak_exp: 'En Yüksek Gider',
        stat_daily_income: 'Günlük Gelir',
        stat_income_pace: 'Kazanç hızı',
        stat_peak_inc: 'En Yüksek Gelir',
        stat_avg_ticket: 'Ortalama Fiş',
        stat_runway: 'Mali Rezerv',
        stat_activity_vol: 'İşlem Hacmi ve Faaliyet',
        stat_cashflow_title: 'Nakit Akışı & Finansal Trend',
        stat_cashflow_sub: 'Gelir ve Gider Karşılaştırması',
        stat_top_categories_title: 'Kategorilere Göre Harcama Dağılımı',
        stat_top_categories_sub: 'Bütçe payı ve tutara göre sıralama',
        stat_weekday_title: 'Haftanın Günlerine Göre Dağılım',
        stat_weekday_sub: 'Harcama alışkanlığı: Pazartesi – Pazar',
        stat_hourly_title: 'Saatlik Harcama Dağılımı',
        stat_hourly_sub: 'En yoğun harcama saatleri (00:00 – 23:00)',
        stat_month_days_title: 'Ayın Günlerine Göre Dağılım',
        stat_month_days_sub: 'Harcama alışkanlığı: Gün 1 – 31',
        stat_table_title: 'Özet Finansal Rapor (P&L)',
        stat_table_sub: 'Gelir, gider ve net bakiye kronolojik tablosu',
        th_period: 'Dönem',
        th_income: 'Gelir',
        th_expense: 'Gider',
        th_net: 'Net Bakiye',
        th_rate: 'Oran',
        popover_header_title: '🛍️ Ürünler | 🛒 Mağazalar',
        prompt_placeholder_name: 'İsim girin...',
        pay_method_card: 'Kart',
        pay_method_cash: 'Nakit',
        btn_merchant_config: '⚙️ Mağazalar',
        merchant_config_title: 'Mağaza Listesi Ayarları',
        merchant_config_sub: 'Sağ tarafta mağaza ve tedarikçi listesinin görünmesini istediğiniz kategorileri seçin:',
        merchant_custom_title: '🛒 Eklenen Özel Mağazalar:',
        btn_done_save: 'Tamam / Kaydet',
        merchant_modal_title: 'Mağaza Analizi ve Alışveriş Sepeti',
        merchant_modal_sub: 'Süpermarketlerde harcama karşılaştırması, pay ve ortalama fiş',
        merchant_kpi_total_food: '💰 TOPLAM GIDA',
        merchant_kpi_total_sub: 'Ayrılan bütçe',
        merchant_kpi_top_store: '🏬 EN ÇOK HARCANAN',
        merchant_kpi_top_sub: '#1 Pay',
        merchant_kpi_avg_ticket: '🧾 ORTALAMA FİŞ',
        merchant_kpi_avg_sub: 'İşlem başına ortalama',
        merchant_kpi_freq_visits: '🛍️ ZİYARET SIKLIĞI',
        merchant_kpi_freq_sub: 'Alışveriş ritmi',
        merchant_chart_title: '📊 Mağazalara Göre Yüzdelik Dağılım',
        merchant_ranking_title: '🏆 Mağazalara Göre Sıralama ve Ortalama Fiş',
        merchant_ranking_sub: 'Tutarlar ve Pay',
        merchant_all_receipts_trigger: 'Tüm gıda alışveriş fişleri',
        merchant_click_to_view_all: 'Tam listeyi görmek için dokunun',
        merchant_stores_suffix: 'Mağaza',
        merchant_receipts_suffix: 'Fiş',
        merchant_receipts_analyzed: 'analiz edilen fiş',
        merchant_visited_suffix: 'ziyaret edilen mağaza',
        merchant_of_food_budget: 'gıda bütçesinden',
        merchant_no_purchases: 'Bu dönemde kayıtlı alışveriş bulunamadı.',
        food_basket_title: 'Gıda Alışveriş Fişleri',
        food_basket_total_val: '💰 Toplam Gıda Fişi Tutarı',
        food_basket_search_placeholder: 'Fişlerde ara (mağaza, açıklama)...',
        food_basket_show_all: 'Tümünü Göster',
        food_basket_filtered: 'Filtrelendi',
        food_basket_empty: 'Uygulanan filtrelere uygun fiş bulunamadı.',
        transfer_modal_title: 'Dahili Transfer (Kart ⇄ Nakit)',
        transfer_lbl_direction: 'TRANSFER YÖNÜ',
        transfer_card_to_cash: 'Kart ➔ Nakit (ATM)',
        transfer_cash_to_card: 'Nakit ➔ Kart (Yatırma)',
        transfer_placeholder_desc: 'İsteğe bağlı açıklama (Örn: ATM çekimi, Para yatırma)',
        transfer_btn_save: 'Transferi Kaydet',
        filter_tx_modal_title: 'İşlemleri Filtrele',
        filter_all_tx_title: 'Tüm İşlemler',
        filter_all_tx_desc: 'Giderler, gelirler ve transferler',
        filter_expenses_tx_title: 'Sadece Giderler',
        filter_expenses_tx_desc: 'Yapılan ödemeler ve alışverişler',
        filter_incomes_tx_title: 'Sadece Gelirler',
        filter_incomes_tx_desc: 'Maaşlar ve eklenen gelirler',
        filter_transfers_tx_title: 'Dahili Transferler',
        filter_transfers_tx_desc: 'Kart ile Nakit arasında para aktarımı',
        filter_period_modal_title: 'Grafik Görüntüleme Dönemi',
        filter_period_current_month_desc: 'Mevcut ayda yapılan harcamalar',
        filter_period_last_month_desc: 'Önceki aya ait harcamalar',
        filter_period_current_year_desc: 'Bu yılki tüm harcamalar',
        filter_period_all_desc: 'Kullanım başlangıcından itibaren tüm geçmiş',
        export_header_categories: 'MONEYAPP - KATEGORİLER',
        export_lbl_period: 'Dönem',
        export_lbl_date: 'Rapor tarihi',
        export_lbl_of_total: 'toplamın',
        export_lbl_tx_history: 'İşlem Geçmişi',
        export_lbl_generated: 'Şuradan oluşturuldu:',
        export_btn: 'Dışa Aktar',
        fund_curr_modal_title: 'Bakiye Dönüşüm Para Birimi',
        fund_curr_modal_desc: 'Başlığın yanında gösterilecek bakiye dönüştürme para birimini seçin:',
        fund_curr_none: 'Dönüşüm yok',
        fund_curr_none_desc: 'Başlığın yanında dönüştürülmüş tutarı gösterme',
        badge_active: 'Aktif',
        toast_fund_curr_disabled: 'Bakiye dönüşümü devre dışı bırakıldı',
        toast_fund_curr_set: 'Bakiye dönüşümü ayarlandı:',
        totals_modal_title: 'Toplam Gelir ve Toplam Gider',
        totals_modal_desc: 'Kaydedilen tüm gelir ve giderlerin genel özeti:',
        totals_card_income: 'Toplam Gelir',
        totals_card_expense: 'Toplam Gider',
        totals_card_net_balance: 'Net Mevcut Fon',
        totals_card_savings_rate: 'Tasarruf Oranı ve Faaliyet',
        totals_card_tx_count: 'aktif işlem',
        lbl_suspend_tx_short: '⏸️ Askıya Al',
        btn_scan_receipt: 'Tara',
        scanner_modal_title: 'Fiş ve Fatura Tarayıcı',
        scanner_status_ready: 'Kamerayı fişe veya QR koda doğrultun',
        scanner_status_scanning: 'Fiş / kod taranıyor...',
        scanner_status_detected: '✅ Veriler başarıyla tanındı!',
        scanner_btn_upload_photo: 'Fotoğraf Yükle / Galeri',
        scanner_btn_live_cam: 'Canlı',
        scanner_result_title: 'Otomatik Tespit Edilen Veriler',
        scanner_lbl_merchant: 'Mağaza / Sağlayıcı',
        scanner_lbl_amount: 'Toplam Tutar',
        scanner_lbl_category: 'Atanan Kategori',
        scanner_lbl_payment_date: 'Ödeme ve Tarih',
        scanner_btn_rescan: '🔄 Yeniden Tara',
        scanner_btn_apply: '✅ Gidere Uygula',
        scanner_err_camera: 'Kameraya erişilemedi. Fiş fotoğrafı yükleyebilirsiniz.',
        scanner_err_no_data: 'Net veri çıkarılamadı. Daha net bir fotoğraf deneyin.',
        stat_bills_title: 'Faturalar & Abonelikler',
        bills_modal_title: 'Fatura & Abonelik Analizi',
        bills_modal_sub: 'Fatura türüne göre aylık gelişim, eğilimler ve yıllık maliyetler',
        bills_kpi_total: '⚡ TOPLAM FATURA',
        bills_kpi_total_sub: 'Seçilen dönemde',
        bills_kpi_avg: '📅 AYLIK ORTALAMA',
        bills_kpi_avg_sub: 'Ortalama fatura harcaması',
        bills_kpi_peak: '🔥 EN YÜKSEK FATURA',
        bills_kpi_share: '📊 BÜTÇE PAYI',
        bills_kpi_share_sub: 'toplam giderlerden',
        bills_chart_title: 'Fatura Türlerine Göre Aylık Gelişim',
        bills_breakdown_title: '⚡ Fatura Türleri ve Sağlayıcılar',
        bills_history_title: '📋 Fatura Ödeme Geçmişi',
        bills_empty: 'Bu dönemde kayıtlı fatura ödemesi bulunamadı.'
    },
    ja: {
        currency_label: '通貨',
        tab_overview: 'ダッシュボード',
        tab_overview_full: '一般ダッシュボード',
        tab_transactions: '取引履歴',
        tab_transactions_full: '取引履歴',
        tab_stats: '統計',
        tab_stats_full: '統計',
        tab_categories: 'カテゴリー',
        tab_categories_full: 'カテゴリー',
        balance_title: '利用可能残高',
        total_expenses: '総支出',
        total_income: '総収入',
        btn_expense: '支出',
        btn_income: '収入',
        expenses_by_cat: 'カテゴリー別支出',
        total_month: '月間合計',
        categories_list_title: 'カテゴリーと支出内訳',
        period_current_month: '今月',
        period_last_month: '先月',
        period_current_year: '今年',
        period_all: '全期間',
        qr_title: 'スマートフォンに接続',
        qr_desc: 'QRコードをスキャンまたはインストール',
        btn_open_qr: 'QRを開く',
        btn_install_guide: 'インストールガイド',
        modal_add_expense: '支出を追加',
        modal_edit_expense: '支出を編集',
        modal_add_income: '収入を追加',
        modal_edit_income: '収入を編集',
        lbl_amount: '金額',
        lbl_date: '日付',
        lbl_category: 'カテゴリーを選択',
        lbl_note: 'メモ / 詳細 (任意)',
        lbl_income_source: '収入源 / 詳細',
        placeholder_amount: '金額 (例: 45.50)',
        placeholder_desc: '例: 買い物、ガソリン',
        placeholder_article: '品目',
        placeholder_store: '店舗',
        placeholder_add_merchant: '+ 新しい店舗...',
        placeholder_income_amount: '収入 (例: 3500)',
        placeholder_income_source: '例: 給与、前払い、ボーナス、家賃',
        lbl_suspend_tx: '⏸️ 取引を一時停止 (計算から除外)',
        suspended_tx_title: '一時停止された取引',
        suspended_tx_desc: 'これらの取引は計算から一時的に除外されています。いつでも再開できます。',
        no_suspended_tx: '一時停止された取引はありません。',
        btn_save: '保存',
        btn_cancel: 'キャンセル',
        history_title: '取引履歴一覧',
        search_placeholder: '説明またはカテゴリーで検索...',
        filter_all: 'すべて',
        filter_expenses: '支出',
        filter_incomes: '収入',
        reports_title: 'レポートと統計',
        annual_income: '年間収入',
        annual_expenses: '年間支出',
        net_savings: '純貯蓄額',
        savings_rate: '貯蓄率',
        monthly_evolution: '月次推移 (収入 vs 支出)',
        categories_title: '支出カテゴリー',
        btn_new_category: '+ 新しいカテゴリー',
        categories_desc: 'カスタムアイコンと色で自由にカテゴリーを作成できます。',
        no_expenses: '支出なし',
        ops_suffix: '件',
        months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        year_prefix: '年',
        backup_title: 'データのバックアップと復元',
        backup_desc: 'バックアップには、取引履歴、カスタムカテゴリー、設定、テーマなどすべてのデータが含まれます。復元すると完全に元の状態に戻ります。',
        btn_export_data: 'データをエクスポート (バックアップ保存)',
        btn_import_data: 'データをインポート (バックアップ復元)',
        btn_close: '閉じる',
        conv_title: '通貨換算と為替レート',
        conv_active_label: '現在の基準通貨:',
        conv_amount_label: '他の通貨に換算する金額:',
        conv_use_balance: '💰 現在の残高',
        conv_results_title: '他の通貨への換算結果:',
        conv_adjust_rate: '⚙️ ユーロ基準レートの調整 (EUR/RON)',
        conv_save_rate: 'ユーロレートを保存',
        conv_active_count: '有効な通貨',
        conv_status_title: '公式リアルタイム為替レート',
        conv_btn_refresh: '更新',
        rates_updated_toast: '為替レートが正常に更新されました！',
        rates_offline_toast: 'オフラインモード：保存されたレートを使用',
        rates_updated_at: '更新日時',
        guide_modal_title: 'MoneyAppのブラウザ・スマホへの追加方法',
        guide_step1: '<strong>Androidスマホ (Chrome):</strong><br>Chromeで開き、右上の<strong>3点メニュー (⋮)</strong>をタップして<strong>「ホーム画面に追加」</strong>を選択します。',
        guide_step2: '<strong>iPhone / iPad (Safari):</strong><br>Safariで開き、下の<strong>共有ボタン</strong>をタップして<strong>「ホーム画面に追加」</strong>を選択します。',
        guide_step3: '<strong>パソコン (Chrome / Edge):</strong><br>アドレスバーのインストールアイコンをクリックするか、<strong>Ctrl + D</strong>でお気に入りに追加します。',
        guide_step4: '<strong>またはAndroid用APKを直接ダウンロード:</strong><br>インストールファイルを直接ダウンロードして共有できます。',
        guide_btn_apk: 'MoneyApp.apk をダウンロード',
        guide_btn_gotit: '了解しました',
        qr_modal_title: '📱 スマホ接続',
        qr_modal_desc: 'スマートフォンでアプリを開くには、下のQRコードをスキャンしてください:',
        qr_step1: 'スマートフォンで<strong>カメラ</strong>アプリを開きます。',
        qr_step2: 'カメラを上の<strong>QRコード</strong>に向けます。',
        qr_step3: '画面に表示された<strong>リンク</strong>をタップして、<strong>ブラウザ</strong>でMoneyAppを開きます！',
        qr_btn_copy: 'コピー',
        btn_download_apk: 'MoneyApp_v3.3.55.apk をダウンロード',
        link_copied: 'リンクをクリップボードにコピーしました！',
        lbl_selected_period: '選択された期間',
        lbl_total_spent: '総支出',
        lbl_of_period_expenses: '期間支出の',
        lbl_category_transactions: 'このカテゴリの取引履歴:',
        btn_close_to_chart: '閉じてグラフに戻る',
        empty_category_expenses: '選択した期間のこのカテゴリの支出はありません。',
        modal_add_category: '新しいカテゴリを追加',
        modal_edit_category: 'カテゴリを編集',
        lbl_category_name: 'カテゴリ名 *',
        placeholder_category_name: '例: 薬局、ギフト、ガソリン',
        lbl_category_icon: 'アイコン / 絵文字',
        lbl_category_color: 'カテゴリの色 *',
        lbl_recommended_colors: 'おすすめのカラーパレット:',
        btn_save_category: 'カテゴリを保存',
        lbl_registered_expenses: '件の登録された支出',
        currency_modal_title: '主要通貨を選択',
        currency_modal_desc: '<strong>MoneyApp</strong>で使用する通貨を選択してください。すべての残高、支出、収入、チャートが自動的に再計算されます。',
        currency_ref_label: '基準通貨',
        currency_active_badge: '✓ 有効',
        stat_dashboard_sub: '財務ダッシュボード＆キャッシュフロー分析',
        stat_pill_month: '今月',
        stat_pill_3months: '3ヶ月',
        stat_pill_year: '今年',
        stat_pill_all: 'すべて',
        stat_income: '総収入',
        stat_expense: '総支出',
        stat_daily_avg: '1日平均支出',
        stat_daily_sub: '支出ペース',
        stat_peak_exp: '最高支出額',
        stat_daily_income: '1日平均収入',
        stat_income_pace: '収入ペース',
        stat_peak_inc: '最高収入額',
        stat_avg_ticket: '平均決済額',
        stat_runway: '資金持続日数',
        stat_activity_vol: '取引件数と活動量',
        stat_cashflow_title: '収支推移＆財務トレンド',
        stat_cashflow_sub: '収入と支出の比較',
        stat_top_categories_title: 'カテゴリ別支出内訳',
        stat_top_categories_sub: '支出額と予算シェアのランキング',
        stat_weekday_title: '曜日別の支出分布',
        stat_weekday_sub: '月曜日〜日曜日の支出傾向',
        stat_hourly_title: '時間帯別の支出分布',
        stat_hourly_sub: '支出のピーク時間帯 (00:00〜23:00)',
        stat_month_days_title: '日別支出分布',
        stat_month_days_sub: '支出パターン：1日～31日',
        stat_table_title: '月次損益計算レポート (P&L)',
        stat_table_sub: '収入・支出・純残高の時系列サマリー',
        th_period: '期間',
        th_income: '収入',
        th_expense: '支出',
        th_net: '純残高',
        th_rate: '貯蓄率',
        popover_header_title: '🛍️ 購入品目 | 🛒 店舗',
        prompt_placeholder_name: '名前を入力...',
        pay_method_card: 'カード',
        pay_method_cash: '現金',
        btn_merchant_config: '⚙️ 店舗設定',
        merchant_config_title: '店舗リスト設定',
        merchant_config_sub: '右側に店舗・仕入先リストを表示したいカテゴリーを選択してください：',
        merchant_custom_title: '🛒 追加されたカスタム店舗：',
        btn_done_save: '完了 / 保存',
        merchant_modal_title: '店舗分析＆買い物バスケット',
        merchant_modal_sub: '店舗別の支出比較、シェアおよび平均決済額',
        merchant_kpi_total_food: '💰 食費合計',
        merchant_kpi_total_sub: '割り当て予算',
        merchant_kpi_top_store: '🏬 トップ店舗',
        merchant_kpi_top_sub: '#1 シェア',
        merchant_kpi_avg_ticket: '🧾 平均レシート額',
        merchant_kpi_avg_sub: '購入ごとの平均',
        merchant_kpi_freq_visits: '🛍️ 来店頻度',
        merchant_kpi_freq_sub: '買い物リズム',
        merchant_chart_title: '📊 店舗別パーセンテージ分布',
        merchant_ranking_title: '🏆 店舗別ランキング＆平均レシート',
        merchant_ranking_sub: '金額とシェア',
        merchant_all_receipts_trigger: 'すべての食費レシート',
        merchant_click_to_view_all: 'タップして全件表示',
        merchant_stores_suffix: '店舗',
        merchant_receipts_suffix: '枚のレシート',
        merchant_receipts_analyzed: '件の分析レシート',
        merchant_visited_suffix: '店舗に来店',
        merchant_of_food_budget: '食費予算に占める割合',
        merchant_no_purchases: 'この期間の購入履歴は見つかりませんでした。',
        food_basket_title: '食費レシート一覧',
        food_basket_total_val: '💰 食費レシート合計額',
        food_basket_search_placeholder: 'レシートを検索 (店舗、詳細)...',
        food_basket_show_all: 'すべて表示',
        food_basket_filtered: '絞り込み',
        food_basket_empty: '適用されたフィルターに一致するレシートはありません。',
        transfer_modal_title: '資金移動 (カード ⇄ 現金)',
        transfer_lbl_direction: '移動方向',
        transfer_card_to_cash: 'カード ➔ 現金 (ATM引き出し)',
        transfer_cash_to_card: '現金 ➔ カード (預入れ)',
        transfer_placeholder_desc: 'メモ (例: ATM引き出し、預入れ)',
        transfer_btn_save: '資金移動を保存',
        filter_tx_modal_title: '取引をフィルター',
        filter_all_tx_title: 'すべての取引',
        filter_all_tx_desc: '支出、収入および資金移動',
        filter_expenses_tx_title: '支出のみ',
        filter_expenses_tx_desc: '決済および買い物',
        filter_incomes_tx_title: '収入のみ',
        filter_incomes_tx_desc: '給与および収入',
        filter_transfers_tx_title: '内部資金移動',
        filter_transfers_tx_desc: 'カードと現金の間で資金移動',
        filter_period_modal_title: 'グラフ表示期間',
        filter_period_current_month_desc: '今月発生した支出',
        filter_period_last_month_desc: '先月発生した支出',
        filter_period_current_year_desc: '今年のすべての支出',
        filter_period_all_desc: '利用開始時からの全履歴',
        export_header_categories: 'MONEYAPP - カテゴリー',
        export_lbl_period: '期間',
        export_lbl_date: 'レポート日付',
        export_lbl_of_total: '全体に占める割合',
        export_lbl_tx_history: '取引履歴',
        export_lbl_generated: '生成元:',
        export_btn: 'エクスポート',
        fund_curr_modal_title: '残高換算通貨',
        fund_curr_modal_desc: 'タイトルの横に表示する利用可能残高の換算通貨を選択してください：',
        fund_curr_none: '換算なし',
        fund_curr_none_desc: 'タイトルの横に換算額を表示しない',
        badge_active: '有効',
        toast_fund_curr_disabled: '残高換算が無効化されました',
        toast_fund_curr_set: '残高換算を設定しました：',
        totals_modal_title: '総収入と総支出',
        totals_modal_desc: '記録されたすべての収入と支出の概要：',
        totals_card_income: '総収入',
        totals_card_expense: '総支出',
        totals_card_net_balance: '純利用可能資金',
        totals_card_savings_rate: '貯蓄率と活動',
        totals_card_tx_count: '件のアクティブな取引',
        lbl_suspend_tx_short: '⏸️ 一時停止',
        btn_scan_receipt: 'スキャン',
        scanner_modal_title: 'レシート・請求書スキャナー',
        scanner_status_ready: 'カメラをレシートまたはQRコードに向けてください',
        scanner_status_scanning: 'レシート/コードを分析中...',
        scanner_status_detected: '✅ データを認識しました！',
        scanner_btn_upload_photo: '写真をアップロード / ギャラリー',
        scanner_btn_live_cam: 'ライブ',
        scanner_result_title: '自動検出されたデータ',
        scanner_lbl_merchant: '店舗 / 請求元',
        scanner_lbl_amount: '合計金額',
        scanner_lbl_category: '割り当てられたカテゴリ',
        scanner_lbl_payment_date: '支払い方法と日付',
        scanner_btn_rescan: '🔄 再スキャン',
        scanner_btn_apply: '✅ 支出に適用',
        scanner_err_camera: 'カメラにアクセスできませんでした。写真をアップロードできます。',
        scanner_err_no_data: 'データを読み取れませんでした。より鮮明な写真をお試しください。',
        stat_bills_title: '請求書＆公共料金',
        bills_modal_title: '請求書・公共料金分析',
        bills_modal_sub: '請求書タイプ別の月次推移、トレンドと年間コスト',
        bills_kpi_total: '⚡ 請求書合計',
        bills_kpi_total_sub: '選択された期間内',
        bills_kpi_avg: '📅 月平均額',
        bills_kpi_avg_sub: '平均公共料金ペース',
        bills_kpi_peak: '🔥 最高請求額',
        bills_kpi_share: '📊 予算シェア',
        bills_kpi_share_sub: '総支出に占める割合',
        bills_chart_title: '請求書タイプ別の月次推移',
        bills_breakdown_title: '⚡ 請求書タイプと提供元',
        bills_history_title: '📋 請求書支払い履歴',
        bills_empty: 'この期間の請求書支払い記録はありません。'
    },
    zh: {
        currency_label: '货币',
        tab_overview: '总览',
        tab_overview_full: '总体概览',
        tab_transactions: '交易',
        tab_transactions_full: '交易明细',
        tab_stats: '统计',
        tab_stats_full: '统计分析',
        tab_categories: '分类',
        tab_categories_full: '分类管理',
        balance_title: '当前可用余额',
        total_expenses: '总支出',
        total_income: '总收入',
        btn_expense: '支出',
        btn_income: '收入',
        expenses_by_cat: '分类支出分析',
        total_month: '本月合计',
        categories_list_title: '分类与支出明细',
        period_current_month: '本月',
        period_last_month: '上月',
        period_current_year: '今年',
        period_all: '所有时间',
        qr_title: '连接到其他手机',
        qr_desc: '扫描二维码或安装应用',
        btn_open_qr: '打开二维码',
        btn_install_guide: '安装指南',
        modal_add_expense: '添加支出',
        modal_edit_expense: '修改支出',
        modal_add_income: '添加收入',
        modal_edit_income: '修改收入',
        lbl_amount: '金额',
        lbl_date: '日期',
        lbl_category: '选择分类',
        lbl_note: '备注 / 详情 (选填)',
        lbl_income_source: '收入来源 / 详情',
        placeholder_amount: '金额 (例: 45.50)',
        placeholder_desc: '例: 购物、加油',
        placeholder_article: '商品',
        placeholder_store: '商店',
        placeholder_add_merchant: '+ 新增商店...',
        placeholder_income_amount: '收入 (例: 3500)',
        placeholder_income_source: '例: 工资、预付款、奖金、房租',
        lbl_suspend_tx: '⏸️ 暂停交易 (从计算中排除)',
        suspended_tx_title: '暂停的交易',
        suspended_tx_desc: '这些交易暂时不计入计算。您可以随时恢复它们。',
        no_suspended_tx: '没有暂停的交易。',
        btn_save: '保存',
        btn_cancel: '取消',
        history_title: '交易历史明细',
        search_placeholder: '按描述或分类搜索...',
        filter_all: '全部',
        filter_expenses: '支出',
        filter_incomes: '收入',
        reports_title: '报表与统计',
        annual_income: '年度收入',
        annual_expenses: '年度支出',
        net_savings: '净储蓄额',
        savings_rate: '储蓄率',
        monthly_evolution: '每月趋势 (收入对比支出)',
        categories_title: '支出分类管理',
        btn_new_category: '+ 新建分类',
        categories_desc: '您可以自由创建个性化分类，自定义颜色与图标。',
        no_expenses: '无支出记录',
        ops_suffix: '笔',
        months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        monthsShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        year_prefix: '年份',
        backup_title: '数据备份与恢复',
        backup_desc: '备份文件包含您的所有数据：交易记录、自定义分类、设置和界面主题。导入时将完全恢复所有内容。',
        btn_export_data: '导出数据 (下载备份文件)',
        btn_import_data: '导入数据 (上传备份文件)',
        btn_close: '关闭',
        conv_title: '货币换算与汇率',
        conv_active_label: '当前默认货币:',
        conv_amount_label: '需要换算为其他货币的金额:',
        conv_use_balance: '💰 当前可用余额',
        conv_results_title: '换算为其他货币:',
        conv_adjust_rate: '⚙️ 调整欧元参考汇率 (EUR/RON)',
        conv_save_rate: '保存欧元汇率',
        conv_active_count: '种活跃货币',
        conv_status_title: '官方实时汇率 (ECB)',
        conv_btn_refresh: '刷新',
        rates_updated_toast: '汇率已成功更新！',
        rates_offline_toast: '离线模式：正在使用上次保存的汇率',
        rates_updated_at: '已更新',
        guide_modal_title: '如何将 MoneyApp 添加到浏览器与手机',
        guide_step1: '<strong>在 Android 手机上 (Chrome):</strong><br>在 Chrome 中打开链接，点击右上角的 <strong>三个点 (⋮)</strong>，选择 <strong>“添加到主屏幕”</strong>。',
        guide_step2: '<strong>在 iPhone / iPad 上 (Safari):</strong><br>在 Safari 中打开，点击底部的 <strong>分享按钮</strong>，然后选择 <strong>“添加到主屏幕”</strong>。',
        guide_step3: '<strong>在电脑上 (Chrome / Edge):</strong><br>点击地址栏右侧的安装图标，或按 <strong>Ctrl + D</strong> 添加到收藏夹。',
        guide_step4: '<strong>或直接下载 Android (APK) 安装包:</strong><br>直接下载安装文件并通过微信/WhatsApp分享。',
        guide_btn_apk: '下载 MoneyApp.apk 安装包',
        guide_btn_gotit: '我知道了',
        qr_modal_title: '📱 连接手机',
        qr_modal_desc: '如需在手机上打开应用，请扫描下方二维码:',
        qr_step1: '在手机上打开<strong>相机</strong>。',
        qr_step2: '将镜头对准上方的<strong>二维码</strong>。',
        qr_step3: '点击屏幕上出现的<strong>链接</strong>即可在<strong>浏览器</strong>中打开 MoneyApp！',
        qr_btn_copy: '复制',
        btn_download_apk: '下载 MoneyApp_v3.3.55.apk',
        link_copied: '链接已复制到剪贴板！',
        lbl_selected_period: '所选期间',
        lbl_total_spent: '总支出',
        lbl_of_period_expenses: '占期间支出',
        lbl_category_transactions: '该类别下的交易明细:',
        btn_close_to_chart: '关闭并返回图表',
        empty_category_expenses: '所选期间内该类别暂无支出。',
        modal_add_category: '添加新类别',
        modal_edit_category: '编辑类别',
        lbl_category_name: '类别名称 *',
        placeholder_category_name: '例如: 药店、礼物、加油',
        lbl_category_icon: '图标 / Emoji',
        lbl_category_color: '类别颜色 *',
        lbl_recommended_colors: '推荐快速颜色:',
        btn_save_category: '保存类别',
        lbl_registered_expenses: '笔已记录支出',
        currency_modal_title: '选择主货币',
        currency_modal_desc: '选择<strong>MoneyApp</strong>运行的主货币。所有数据、余额、支出、收入和图表将自动以所选货币重新计算和显示。',
        currency_ref_label: '基准货币',
        currency_active_badge: '✓ 当前使用',
        stat_dashboard_sub: '财务仪表板与现金流分析',
        stat_pill_month: '本月',
        stat_pill_3months: '近3个月',
        stat_pill_year: '今年',
        stat_pill_all: '全部',
        stat_income: '总收入',
        stat_expense: '总支出',
        stat_daily_avg: '日均支出',
        stat_daily_sub: '支出节奏',
        stat_peak_exp: '最高单笔支出',
        stat_daily_income: '日均收入',
        stat_income_pace: '赚钱速度',
        stat_peak_inc: '最高单笔收入',
        stat_avg_ticket: '客单均额',
        stat_runway: '资金可持续天数',
        stat_activity_vol: '交易活跃度与总量',
        stat_cashflow_title: '收支走势与财务趋势',
        stat_cashflow_sub: '收入与支出动态对比',
        stat_top_categories_title: '各类别支出占比分析',
        stat_top_categories_sub: '按金额与预算占比排序',
        stat_weekday_title: '星期支出分布',
        stat_weekday_sub: '周一至周日的消费规律',
        stat_hourly_title: '各时段支出分布',
        stat_hourly_sub: '消费高峰时段 (00:00 – 23:00)',
        stat_month_days_title: '按月天数分布',
        stat_month_days_sub: '支出模式：1日 – 31日',
        stat_table_title: '月度损益汇总表 (P&L)',
        stat_table_sub: '收入、支出与净现金流按月明细',
        th_period: '期间',
        th_income: '收入',
        th_expense: '支出',
        th_net: '净现金流',
        th_rate: '储蓄率',
        popover_header_title: '🛍️ 购物清单 | 🛒 商店',
        prompt_placeholder_name: '输入名称...',
        pay_method_card: '银行卡',
        pay_method_cash: '现金',
        btn_merchant_config: '⚙️ 商店设置',
        merchant_config_title: '商店列表设置',
        merchant_config_sub: '勾选需要右侧显示商店和供应商列表的分类：',
        merchant_custom_title: '🛒 自定义添加的商店：',
        btn_done_save: '完成 / 保存',
        merchant_modal_title: '商店分析与食物消费明细',
        merchant_modal_sub: '各大超市消费对比、预算占比与平均客单价',
        merchant_kpi_total_food: '💰 食品总支出',
        merchant_kpi_total_sub: '已用预算',
        merchant_kpi_top_store: '🏬 消费最高商店',
        merchant_kpi_top_sub: '#1 占比',
        merchant_kpi_avg_ticket: '🧾 平均客单价',
        merchant_kpi_avg_sub: '单笔购买均额',
        merchant_kpi_freq_visits: '🛍️ 消费频次',
        merchant_kpi_freq_sub: '购物频率',
        merchant_chart_title: '📊 各商店消费占比分布',
        merchant_ranking_title: '🏆 各商店排名与客单价分析',
        merchant_ranking_sub: '金额与占比',
        merchant_all_receipts_trigger: '所有食品消费小票',
        merchant_click_to_view_all: '点击查看完整列表',
        merchant_stores_suffix: '家商店',
        merchant_receipts_suffix: '张小票',
        merchant_receipts_analyzed: '笔已分析消费',
        merchant_visited_suffix: '家已光顾商店',
        merchant_of_food_budget: '食品预算占比',
        merchant_no_purchases: '此期间内未找到购物记录。',
        food_basket_title: '食品消费明细',
        food_basket_total_val: '💰 食品消费总额',
        food_basket_search_placeholder: '搜索小票 (商店、说明)...',
        food_basket_show_all: '显示全部',
        food_basket_filtered: '已筛选',
        food_basket_empty: '未找到符合筛选条件的小票记录。',
        transfer_modal_title: '内部转账 (银行卡 ⇄ 现金)',
        transfer_lbl_direction: '转账方向',
        transfer_card_to_cash: '银行卡 ➔ 现金 (ATM取款)',
        transfer_cash_to_card: '现金 ➔ 银行卡 (存款)',
        transfer_placeholder_desc: '选填说明 (例: ATM取现、存款)',
        transfer_btn_save: '保存转账记录',
        filter_tx_modal_title: '筛选交易明细',
        filter_all_tx_title: '所有交易',
        filter_all_tx_desc: '支出、收入与转账',
        filter_expenses_tx_title: '仅支出',
        filter_expenses_tx_desc: '付款与日常消费',
        filter_incomes_tx_title: '仅收入',
        filter_incomes_tx_desc: '工资与入账款项',
        filter_transfers_tx_title: '内部转账',
        filter_transfers_tx_desc: '银行卡与现金之间转移',
        filter_period_modal_title: '图表显示周期',
        filter_period_current_month_desc: '本月内发生的所有支出',
        filter_period_last_month_desc: '上月发生的所有支出',
        filter_period_current_year_desc: '本年度内所有支出',
        filter_period_all_desc: '自使用以来的全部历史记录',
        export_header_categories: 'MONEYAPP - 分类',
        export_lbl_period: '周期',
        export_lbl_date: '报表日期',
        export_lbl_of_total: '占总额',
        export_lbl_tx_history: '交易历史明细',
        export_lbl_generated: '生成自',
        export_btn: '导出',
        fund_curr_modal_title: '资金换算货币',
        fund_curr_modal_desc: '选择在标题旁显示的可用资金换算货币：',
        fund_curr_none: '不换算',
        fund_curr_none_desc: '在标题旁不显示换算金额',
        badge_active: '已启用',
        toast_fund_curr_disabled: '资金换算已停用',
        toast_fund_curr_set: '资金换算已设置为',
        totals_modal_title: '总收入和总支出',
        totals_modal_desc: '所有已记录收入和支出的总体摘要：',
        totals_card_income: '总收入',
        totals_card_expense: '总支出',
        totals_card_net_balance: '净可用资金',
        totals_card_savings_rate: '储蓄率与活动',
        totals_card_tx_count: '笔有效交易',
        lbl_suspend_tx_short: '⏸️ 暂停',
        btn_scan_receipt: '扫描',
        scanner_modal_title: '小票与账单智能扫描',
        scanner_status_ready: '将摄像头对准小票或二维码',
        scanner_status_scanning: '正在分析小票/代码...',
        scanner_status_detected: '✅ 数据识别成功！',
        scanner_btn_upload_photo: '上传照片 / 相册',
        scanner_btn_live_cam: '实时相机',
        scanner_result_title: '自动提取的数据',
        scanner_lbl_merchant: '商户 / 机构',
        scanner_lbl_amount: '总金额',
        scanner_lbl_category: '匹配分类',
        scanner_lbl_payment_date: '支付方式与日期',
        scanner_btn_rescan: '🔄 重新扫描',
        scanner_btn_apply: '✅ 填入支出表单',
        scanner_err_camera: '无法访问摄像头，您可以上传小票照片。',
        scanner_err_no_data: '未能提取有效数据，请尝试更清晰的照片。',
        stat_bills_title: '账单与公用事业',
        bills_modal_title: '账单与公用事业分析',
        bills_modal_sub: '按账单类型查看每月趋势、消费规律与年度成本',
        bills_kpi_total: '⚡ 账单总支出',
        bills_kpi_total_sub: '在所选期间内',
        bills_kpi_avg: '📅 月均支出',
        bills_kpi_avg_sub: '公用事业平均水平',
        bills_kpi_peak: '🔥 最高单笔账单',
        bills_kpi_share: '📊 预算占比',
        bills_kpi_share_sub: '占总支出的比例',
        bills_chart_title: '各类账单每月走势分析',
        bills_breakdown_title: '⚡ 账单类型与供应商',
        bills_history_title: '📋 账单缴费明细记录',
        bills_empty: '此期间内无账单缴费记录。'
    }
};

function getLanguageForCurrency(curr = null) {
    const code = curr || getActiveCurrency();
    return CURRENCY_TO_LANG[code] || 'en';
}

function t(key, lang = null) {
    const activeLang = lang || getLanguageForCurrency();
    if (I18N_DICTIONARY[activeLang] && I18N_DICTIONARY[activeLang][key] !== undefined) {
        return I18N_DICTIONARY[activeLang][key];
    }
    if (I18N_DICTIONARY['en'] && I18N_DICTIONARY['en'][key] !== undefined) {
        return I18N_DICTIONARY['en'][key];
    }
    if (I18N_DICTIONARY['ro'] && I18N_DICTIONARY['ro'][key] !== undefined) {
        return I18N_DICTIONARY['ro'][key];
    }
    return key;
}

const LOCALIZED_CURRENCY_NAMES = {
    ro: {
        RON: 'Leu Românesc',
        EUR: 'Euro',
        USD: 'Dolar American',
        GBP: 'Liră Sterlină',
        CHF: 'Franc Elvețian',
        INR: 'Rupie Indiană',
        CNY: 'Yuan Chinezesc',
        JPY: 'Yen Japonez',
        TRY: 'Liră Turcească',
        EGP: 'Liră Egipteană',
        MDL: 'Leu Moldovenesc',
        CAD: 'Dolar Canadian',
        AUD: 'Dolar Australian'
    },
    en: {
        RON: 'Romanian Leu',
        EUR: 'Euro',
        USD: 'US Dollar',
        GBP: 'British Pound',
        CHF: 'Swiss Franc',
        INR: 'Indian Rupee',
        CNY: 'Chinese Yuan',
        JPY: 'Japanese Yen',
        TRY: 'Turkish Lira',
        EGP: 'Egyptian Pound',
        MDL: 'Moldovan Leu',
        CAD: 'Canadian Dollar',
        AUD: 'Australian Dollar'
    },
    de: {
        RON: 'Rumänischer Leu',
        EUR: 'Euro',
        USD: 'US-Dollar',
        GBP: 'Britisches Pfund',
        CHF: 'Schweizer Franken',
        INR: 'Indische Rupie',
        CNY: 'Chinesischer Yuan',
        JPY: 'Japanischer Yen',
        TRY: 'Türkische Lira',
        EGP: 'Ägyptisches Pfund',
        MDL: 'Moldauischer Leu',
        CAD: 'Kanadischer Dollar',
        AUD: 'Australischer Dollar'
    },
    tr: {
        RON: 'Rumen Leyi',
        EUR: 'Euro',
        USD: 'Amerikan Doları',
        GBP: 'İngiliz Sterlini',
        CHF: 'İsviçre Frangı',
        INR: 'Hindistan Rupisi',
        CNY: 'Çin Yuanı',
        JPY: 'Japon Yeni',
        TRY: 'Türk Lirası',
        EGP: 'Mısır Lirası',
        MDL: 'Moldova Leyi',
        CAD: 'Kanada Doları',
        AUD: 'Avustralya Doları'
    },
    ja: {
        RON: 'ルーマニア・レウ',
        EUR: 'ユーロ',
        USD: '米ドル',
        GBP: '英ポンド',
        CHF: 'スイス・フラン',
        INR: 'インド・ルピー',
        CNY: '中国人民元',
        JPY: '日本円',
        TRY: 'トルコ・リラ',
        EGP: 'エジプト・ポンド',
        MDL: 'モルドバ・レウ',
        CAD: 'カナダ・ドル',
        AUD: 'オーストラリア・ドル'
    },
    zh: {
        RON: '罗马尼亚列伊',
        EUR: '欧元',
        USD: '美元',
        GBP: '英镑',
        CHF: '瑞士法郎',
        INR: '印度卢比',
        CNY: '人民币',
        JPY: '日元',
        TRY: '土耳其里拉',
        EGP: '埃及镑',
        MDL: '摩尔多瓦列伊',
        CAD: '加拿大元',
        AUD: '澳大利亚元'
    }
};

function getLocalizedCurrencyName(code, lang = null) {
    const l = lang || getLanguageForCurrency();
    if (LOCALIZED_CURRENCY_NAMES[l] && LOCALIZED_CURRENCY_NAMES[l][code]) {
        return LOCALIZED_CURRENCY_NAMES[l][code];
    }
    if (LOCALIZED_CURRENCY_NAMES['en'] && LOCALIZED_CURRENCY_NAMES['en'][code]) {
        return LOCALIZED_CURRENCY_NAMES['en'][code];
    }
    const found = WORLD_CURRENCIES.find(c => c.code === code);
    return found ? found.name : code;
}

function applyLanguage() {
    const lang = getLanguageForCurrency();
    const curInfo = getCurrencyInfo();

    // Actualizare data-i18n in toata pagina
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const val = t(key, lang);
        if (val) {
            if (val.includes('<') || val.includes('&')) {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        }
    });

    // Actualizare data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const val = t(key, lang);
        if (val) el.placeholder = val;
    });

    // Actualizare placeholder caseta suma cheltuiala (+ RON / + EUR / + USD)
    updateExpenseAmountPlaceholder();

    // Actualizare subtitlu antet
    const subTitle = document.getElementById('activeSectionSubtitle');
    if (subTitle) {
        subTitle.textContent = `${t('currency_label', lang)}: ${curInfo.name} (${curInfo.symbol})`;
    }

    // Actualizare dropdown landscape
    const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab || 'tab-overview';
    const tabInfo = {
        'tab-overview': { name: t('tab_overview', lang), icon: '📊' },
        'tab-transactions': { name: t('tab_transactions', lang), icon: '📜' },
        'tab-stats': { name: t('tab_stats', lang), icon: '📈' },
        'tab-categories': { name: t('tab_categories', lang), icon: '🏷️' }
    };
    if (tabInfo[activeTab]) {
        const titleEl = document.getElementById('landscapeActiveTabTitle');
        const iconEl = document.getElementById('landscapeActiveTabIcon');
        if (titleEl) titleEl.textContent = tabInfo[activeTab].name;
        if (iconEl) iconEl.textContent = tabInfo[activeTab].icon;
    }

    // Actualizare dinamica badge moneda venit
    updateIncomeCurrencyBadge();
    updateHeaderRunwayWidget();

    // Actualizare dinamica titluri modale cheltuieli & venit
    const expEditId = document.getElementById('editExpenseId')?.value;
    const expTitleEl = document.getElementById('modalExpenseTitle');
    if (expTitleEl) {
        expTitleEl.innerHTML = expEditId
            ? `<span style="color:var(--accent)">✏️</span> ${t('modal_edit_expense', lang)}`
            : `<span style="color:var(--danger)">▼</span> ${t('modal_add_expense', lang)}`;
    }
    const incEditId = document.getElementById('editIncomeId')?.value;
    const incTitleEl = document.getElementById('modalIncomeTitle');
    if (incTitleEl) {
        incTitleEl.innerHTML = incEditId
            ? `<span style="color:var(--accent)">✏️</span> ${t('modal_edit_income', lang)}`
            : `<span style="color:var(--success)">▲</span> ${t('modal_add_income', lang)}`;
    }

    const catEditId = document.getElementById('editCategoryId')?.value;
    const catTitleEl = document.getElementById('categoryFormModalTitle');
    if (catTitleEl) {
        catTitleEl.textContent = catEditId
            ? t('modal_edit_category', lang)
            : t('modal_add_category', lang);
    }

    // Actualizare selector perioada panou general (ex: This Month, Dieser Monat)
    const savedPeriod = document.getElementById('overviewPeriod')?.value || (appData.settings && appData.settings.overviewPeriod) || 'current-month';
    if (typeof updateOverviewPeriodFilterUI === 'function') {
        updateOverviewPeriodFilterUI(savedPeriod);
    }
}

function getCurrencySymbolDisplay(code = null) {
    const curCode = code || getActiveCurrency();
    const found = WORLD_CURRENCIES.find(c => c.code === curCode);
    if (!found) return curCode;
    if (found.code === 'RON' || found.code === 'MDL') return 'lei';
    return found.symbol || found.code;
}

// Seteaza textul indicativ in caseta de suma: sageata urmata de simbolul monedei selectate (ex: "→ lei", "→ €", "→ $", "→ £")
function updateExpenseAmountPlaceholder() {
    const expAmt = document.getElementById('expenseAmount');
    if (!expAmt) return;
    const expSelect = document.getElementById('expenseCurrencySelect');
    const curr = (expSelect && expSelect.value) ? expSelect.value : getActiveCurrency();
    const sym = getCurrencySymbolDisplay(curr);
    expAmt.placeholder = `→ ${sym}`;
}

function populateCurrencySelectors() {
    const expSelect = document.getElementById('expenseCurrencySelect');
    const incSelect = document.getElementById('incomeCurrencySelect');
    const mainCurr = getActiveCurrency();
    const optionsHtml = WORLD_CURRENCIES.map(c => 
        `<option value="${c.code}">${c.flag} ${c.name} (${c.symbol || c.code})</option>`
    ).join('');

    if (expSelect) {
        const curVal = expSelect.value;
        expSelect.innerHTML = optionsHtml;
        expSelect.value = curVal || mainCurr;
    }
    if (incSelect) {
        const curVal = incSelect.value;
        incSelect.innerHTML = optionsHtml;
        incSelect.value = curVal || mainCurr;
    }
    updateExpenseAmountPlaceholder();
}

function updateIncomeCurrencyBadge() {
    populateCurrencySelectors();
}

function getActiveCurrency() {
    if (typeof appData !== 'undefined' && appData && appData.settings && appData.settings.mainCurrency) {
        return appData.settings.mainCurrency;
    }
    return 'RON';
}

function getCurrencyInfo(code = null) {
    const curCode = code || getActiveCurrency();
    const found = WORLD_CURRENCIES.find(c => c.code === curCode);
    if (found) {
        let rate = found.rateToRon;
        if (typeof appData !== 'undefined' && appData && appData.settings) {
            if (appData.settings.exchangeRates && appData.settings.exchangeRates.ratesToRon && appData.settings.exchangeRates.ratesToRon[curCode]) {
                rate = parseFloat(appData.settings.exchangeRates.ratesToRon[curCode]) || rate;
            } else if (curCode === 'EUR' && appData.settings.eurRate) {
                rate = parseFloat(appData.settings.eurRate) || rate;
            }
        }
        return { ...found, rateToRon: rate };
    }
    return { code: curCode, name: curCode, symbol: curCode, flag: '🌐', rateToRon: 1.00 };
}

function convertFromRon(amountInRon, targetCurrency = null) {
    const curr = targetCurrency || getActiveCurrency();
    const info = getCurrencyInfo(curr);
    const rate = info.rateToRon || 1.00;
    return (parseFloat(amountInRon) || 0) / rate;
}

function convertToRon(amount, sourceCurrency = null) {
    const curr = sourceCurrency || getActiveCurrency();
    const info = getCurrencyInfo(curr);
    const rate = info.rateToRon || 1.00;
    return (parseFloat(amount) || 0) * rate;
}

// Helper: Normalizare text și eliminare diacritice (pentru căutare insensibilă: paine = pâine, etc.)
function normalizeDiacritics(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ș|ş/gi, 's')
        .replace(/ț|ţ/gi, 't')
        .toLowerCase()
        .trim();
}

// Helper Formatter Universal
function formatMoney(amount, currency = null) {
    const curr = currency || getActiveCurrency();
    const info = getCurrencyInfo(curr);
    const num = parseFloat(amount) || 0;
    const formatted = num.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (info.code === 'EUR' || info.symbol === '€') return `${formatted} €`;
    if (info.code === 'USD' || info.symbol === '$') return `$ ${formatted}`;
    if (info.code === 'GBP' || info.symbol === '£') return `£ ${formatted}`;
    if (info.code === 'INR' || info.symbol === '₹') return `₹ ${formatted}`;
    if (info.code === 'CNY' || info.code === 'JPY' || info.symbol === '¥') return `¥ ${formatted}`;
    if (info.code === 'TRY' || info.symbol === '₺') return `${formatted} ₺`;
    if (info.code === 'EGP' || info.symbol === 'E£') return `${formatted} E£`;
    if (info.code === 'CHF') return `${formatted} CHF`;
    if (info.code === 'MDL') return `${formatted} MDL`;
    if (info.code === 'CAD' || info.symbol === 'C$') return `C$ ${formatted}`;
    if (info.code === 'AUD' || info.symbol === 'A$') return `A$ ${formatted}`;
    return `${formatted} ${info.symbol || info.code}`;
}

function getSecondaryCurrency() {
    if (appData && appData.settings && appData.settings.secondaryCurrency) {
        return appData.settings.secondaryCurrency;
    }
    return 'auto';
}

function updateSecondaryCurrencyDisplay() {
    const secSelect = document.getElementById('selectSecondaryCurrency');
    const secCode = document.getElementById('secCurrDisplayCode');
    const currentSec = getSecondaryCurrency();
    if (secSelect) secSelect.value = currentSec;
    if (secCode) {
        if (currentSec === 'none') {
            secCode.textContent = '(Fără)';
        } else if (currentSec === 'auto') {
            secCode.textContent = '(Auto)';
        } else {
            secCode.textContent = `(${currentSec})`;
        }
    }
}

function formatTransactionAmountHtml(tx, mainCurr, isExpense = true) {
    const sign = isExpense ? '-' : '+';
    const colorClass = isExpense ? 'expense-color' : 'income-color';
    const amtRon = parseFloat(tx.amountInRon) || parseFloat(tx.amount) || 0;
    const mainAmount = convertFromRon(amtRon, mainCurr);
    const mainText = `${sign}${formatMoney(mainAmount, mainCurr)}`;

    const secSetting = getSecondaryCurrency();
    let secondaryHtml = '';

    if (secSetting === 'none') {
        secondaryHtml = '';
    } else if (secSetting === 'auto') {
        if (tx.originalCurrency && tx.originalCurrency !== mainCurr) {
            secondaryHtml = `<span class="tx-secondary-val">(${formatMoney(tx.amount, tx.originalCurrency)})</span>`;
        } else if (mainCurr !== 'RON') {
            secondaryHtml = `<span class="tx-secondary-val">(${formatMoney(amtRon, 'RON')})</span>`;
        }
    } else {
        // Moneda explicită aleasă de utilizator (ex: GBP, EUR, USD, RON, etc.)
        if (secSetting !== mainCurr) {
            const secAmount = convertFromRon(amtRon, secSetting);
            secondaryHtml = `<span class="tx-secondary-val">(${formatMoney(secAmount, secSetting)})</span>`;
        } else if (tx.originalCurrency && tx.originalCurrency !== mainCurr) {
            secondaryHtml = `<span class="tx-secondary-val">(${formatMoney(tx.amount, tx.originalCurrency)})</span>`;
        }
    }

    return `
        <div class="tx-val-block">
            <span class="tx-val ${colorClass}">${mainText}</span>
            ${secondaryHtml}
        </div>
    `;
}

function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
}

function getTransactionTimeDisplay(tx) {
    if (!tx) return '';
    if (tx.time && typeof tx.time === 'string' && tx.time.trim().length > 0) {
        return tx.time.trim();
    }
    if (tx.createdAt) {
        try {
            const d = new Date(tx.createdAt);
            if (!isNaN(d.getTime())) {
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                return `${hh}:${mm}`;
            }
        } catch (e) {}
    }
    return '';
}

// Toast helper modern: dreptunghiular pe fundal gri, text alb clar si bordura fina neagra
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = '🔔';
    if (type === 'success') {
        icon = '✨';
    } else if (type === 'error') {
        icon = '⚠️';
    }

    toast.innerHTML = `<span style="font-size: 1.05rem; line-height: 1; flex-shrink: 0;">${icon}</span> <span style="line-height: 1.4; text-align: left;">${escapeHtml(message).replace(/\n/g, '<br>')}</span>`;
    
    // Stiluri cerute: fundal gri modern, dreptunghiular, scris alb luminos, bordura fina neagra
    toast.style.backgroundColor = '#334155';
    toast.style.color = '#ffffff';
    toast.style.border = '1.5px solid #000000';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.45)';

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

// ==========================================
// PERSISTENȚĂ SECURIZATĂ PE DISC (ANDROID NATIVE DISK & SAFETY MIRROR)
// ==========================================
let nativeWriteTimeout = null;

function persistDatabaseToFile() {
    if (!window.AndroidBridge || typeof window.AndroidBridge.persistDatabase !== 'function') {
        return;
    }

    if (nativeWriteTimeout) clearTimeout(nativeWriteTimeout);
    nativeWriteTimeout = setTimeout(() => {
        try {
            const payload = {
                appName: "MoneyApp",
                version: "2.6.9",
                savedAt: new Date().toISOString(),
                categories: appData.categories,
                transactions: appData.transactions,
                settings: appData.settings
            };
            const jsonStr = JSON.stringify(payload, null, 2);
            window.AndroidBridge.persistDatabase(jsonStr);
            console.log("MoneyApp: Baza de date a fost salvată pe disc (moneyapp_database.json & .bak)");
        } catch (e) {
            console.error("MoneyApp: Eroare la scrierea bazei de date pe disc:", e);
        }
    }, 300);
}

function initNativeDatabase() {
    if (!window.AndroidBridge || typeof window.AndroidBridge.readDatabase !== 'function') {
        return false;
    }

    try {
        const diskJson = window.AndroidBridge.readDatabase();
        if (diskJson && diskJson.trim().length > 0) {
            const parsed = JSON.parse(diskJson);
            if (parsed && (Array.isArray(parsed.categories) || Array.isArray(parsed.transactions))) {
                if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
                    appData.categories = parsed.categories;
                }
                if (Array.isArray(parsed.transactions)) {
                    appData.transactions = parsed.transactions;
                }
                if (parsed.settings) {
                    appData.settings = { ...appData.settings, ...parsed.settings };
                }

                // Sincronizare automata in localStorage
                try {
                    localStorage.setItem('moneyapp_data_v1', JSON.stringify(appData));
                } catch (lsErr) {}

                console.log("MoneyApp: Bază de date recuperată de pe disc:", (appData.transactions || []).length, "tranzacții,", (appData.categories || []).length, "categorii");
                return true;
            }
        }
    } catch (e) {
        console.error("MoneyApp: Eroare la citirea bazei de date de pe disc:", e);
    }
    return false;
}

// LocalStorage & Native persistence
function loadData() {
    try {
        // 1. Încercare recuperare securizată din fișierul fizic de pe disc (Android Native Storage)
        const recoveredFromDisk = initNativeDatabase();

        if (!recoveredFromDisk) {
            // 2. Dacă nu a fost găsit fișier pe disc, citire din localStorage
            const stored = localStorage.getItem('moneyapp_data_v1');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.categories && parsed.categories.length > 0) {
                    appData.categories = parsed.categories;
                }
                if (Array.isArray(parsed.transactions)) {
                    appData.transactions = parsed.transactions;
                }
                if (parsed.settings) {
                    appData.settings = { ...appData.settings, ...parsed.settings };
                }
            } else {
                // Initial samples
                const today = getTodayString();
                appData.transactions = [
                    {
                        id: 'tx-init-1',
                        type: 'income',
                        amount: 4500,
                        originalCurrency: 'RON',
                        amountInRon: 4500,
                        description: 'Venit inițial / Salariu',
                        date: today,
                        createdAt: Date.now() - 3600000
                    },
                    {
                        id: 'tx-init-2',
                        type: 'expense',
                        amount: 250,
                        originalCurrency: 'RON',
                        amountInRon: 250,
                        categoryId: 'cat-1',
                        description: 'Cumpărături supermarket',
                        date: today,
                        createdAt: Date.now() - 1800000
                    },
                    {
                        id: 'tx-init-3',
                        type: 'expense',
                        amount: 180,
                        originalCurrency: 'RON',
                        amountInRon: 180,
                        categoryId: 'cat-2',
                        description: 'Factură energie electrică',
                        date: today,
                        createdAt: Date.now() - 900000
                    }
                ];
                saveData();
            }
        }

        if (!appData.settings) appData.settings = {};
        if (!appData.settings.mainCurrency) appData.settings.mainCurrency = 'RON';
        if (!appData.settings.secondaryCurrency) appData.settings.secondaryCurrency = 'auto';
        window.appData = appData;

        // Asigurare scriere inițială pe disc a bazei de date
        persistDatabaseToFile();
    } catch (e) {
        console.error('Eroare la încărcarea datelor:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem('moneyapp_data_v1', JSON.stringify(appData));
        persistDatabaseToFile();
    } catch (e) {
        console.error('Eroare la salvarea datelor:', e);
    }
}

// Apply Theme
function applyTheme(theme) {
    const tIcon = document.getElementById('themeIcon');
    if (theme === 'light') {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
        document.body.classList.add('light-theme');
        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) themeMeta.setAttribute('content', '#f1f5f9');
        if (tIcon) tIcon.innerHTML = '<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 12.6l1.79 1.79 1.41-1.41-1.79-1.79-1.41 1.41zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>';
    } else {
        document.documentElement.classList.remove('light-theme');
        document.body.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) themeMeta.setAttribute('content', '#0b1120');
        if (tIcon) tIcon.innerHTML = '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>';
    }
    if (window.AndroidBridge && typeof window.AndroidBridge.updateTheme === 'function') {
        try {
            window.AndroidBridge.updateTheme(theme);
        } catch (e) {}
    }
}

function isTxSuspended(tx) {
    return !!(tx && (tx.isSuspended === true || tx.isSuspended === 'true' || tx.suspended === true));
}

function updateBalanceCards() {
    const mainCurr = getActiveCurrency();
    let totalIncomeRon = 0;
    let totalExpenseRon = 0;
    let cardIncomeRon = 0;
    let cardExpenseRon = 0;
    let cashIncomeRon = 0;
    let cashExpenseRon = 0;

    appData.transactions.forEach(tx => {
        if (isTxSuspended(tx)) return; // Exclude suspended
        const amtRon = parseFloat(tx.amountInRon) || parseFloat(tx.amount) || 0;
        const method = (tx.paymentMethod === 'cash') ? 'cash' : 'card';
        if (tx.type === 'income') {
            totalIncomeRon += amtRon;
            if (method === 'cash') cashIncomeRon += amtRon;
            else cardIncomeRon += amtRon;
        } else if (tx.type === 'expense') {
            totalExpenseRon += amtRon;
            if (method === 'cash') cashExpenseRon += amtRon;
            else cardExpenseRon += amtRon;
        } else if (tx.type === 'transfer') {
            const dir = tx.transferDirection || 'card-to-cash';
            if (dir === 'card-to-cash') {
                cardExpenseRon += amtRon;
                cashIncomeRon += amtRon;
            } else if (dir === 'cash-to-card') {
                cashExpenseRon += amtRon;
                cardIncomeRon += amtRon;
            }
        }
    });

    const netBalanceRon = totalIncomeRon - totalExpenseRon;
    const cardBalanceRon = cardIncomeRon - cardExpenseRon;
    const cashBalanceRon = cashIncomeRon - cashExpenseRon;

    const displayBalance = convertFromRon(netBalanceRon, mainCurr);
    const displayCard = convertFromRon(cardBalanceRon, mainCurr);
    const displayCash = convertFromRon(cashBalanceRon, mainCurr);
    const displayIncome = convertFromRon(totalIncomeRon, mainCurr);
    const displayExpense = convertFromRon(totalExpenseRon, mainCurr);

    const balanceEl = document.getElementById('displayTotalBalance');
    if (balanceEl) {
        const num = parseFloat(displayBalance || 0);
        const isNeg = num < 0;
        const absStr = Math.abs(num).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const parts = absStr.split(',');
        const intPart = (isNeg ? '-' : '') + parts[0];
        const decPart = parts[1] || '00';
        balanceEl.innerHTML = `<span class="bal-int">${intPart}</span><span class="bal-dec">,${decPart}</span> <span class="bal-curr">${mainCurr}</span>`;
        balanceEl.className = displayBalance >= 0 ? 'balance-amount positive' : 'balance-amount negative';
    }

    const formatSplitDigits = (val) => {
        const num = parseFloat(val || 0);
        const str = num.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const parts = str.split(',');
        const intPart = parts[0];
        const decPart = parts[1] || '00';
        return `<span class="source-int">${intPart}</span><span class="source-dec">,${decPart}</span>`;
    };

    const cardEl = document.getElementById('displayCardBalance');
    if (cardEl) {
        cardEl.innerHTML = `${formatSplitDigits(displayCard)} <span class="source-curr">${mainCurr}</span>`;
        cardEl.className = displayCard >= 0 ? 'source-val positive' : 'source-val negative';
    }

    const cashEl = document.getElementById('displayCashBalance');
    if (cashEl) {
        cashEl.innerHTML = `${formatSplitDigits(displayCash)} <span class="source-curr">${mainCurr}</span>`;
        cashEl.className = displayCash >= 0 ? 'source-val positive' : 'source-val negative';
    }

    // Conversie secundară afișată imediat după titlul Fond Disponibil
    const convCurr = appData.settings?.fundConversionCurrency || (mainCurr === 'RON' ? 'EUR' : 'RON');
    const headerConvEl = document.getElementById('displayHeaderConvertedBalance');

    if (headerConvEl) {
        if (convCurr === 'none' || convCurr === mainCurr) {
            headerConvEl.style.display = 'none';
            headerConvEl.innerHTML = '';
        } else {
            headerConvEl.style.display = 'inline-flex';
            const convertedVal = convertFromRon(netBalanceRon, convCurr);
            headerConvEl.innerHTML = `<span class="conv-sep">-</span> <span>${formatMoney(convertedVal, convCurr)}</span>`;
        }
    }

    const oldEurEl = document.getElementById('displayConvertedEur');
    if (oldEurEl) {
        oldEurEl.style.display = 'none';
        oldEurEl.textContent = '';
    }

    const incEl = document.getElementById('displayTotalIncome');
    if (incEl) incEl.textContent = formatMoney(displayIncome, mainCurr);

    const expEl = document.getElementById('displayTotalExpense');
    if (expEl) expEl.textContent = formatMoney(displayExpense, mainCurr);

    // Actualizare indicator M in antet
    const logoInd = document.getElementById('logoCurrencyIndicator');
    if (logoInd) logoInd.textContent = mainCurr;

    // Actualizare Widget Autonomie Financiara in coltul sus dreapta al antetului
    updateHeaderRunwayWidget();
}

// Calcul Autonomie Financiară Globală (Banii actuali din cont / Ritmul de cheltuieli recent)
function calculateGlobalRunwayDays() {
    // 1. Sold curent total din cont (Venituri - Cheltuieli active)
    let totalBalRon = 0;
    appData.transactions.forEach(t => {
        if (isTxSuspended(t)) return;
        const a = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        if (t.type === 'income') totalBalRon += a;
        else if (t.type === 'expense') totalBalRon -= a;
    });

    if (totalBalRon <= 0) return 0;

    // 2. Ritm de cheltuieli pe luna curentă
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const curMonthStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;
    const daysElapsedInMonth = Math.max(1, today.getDate());

    let curMonthExpenseRon = 0;
    appData.transactions.forEach(t => {
        if (!isTxSuspended(t) && t.type === 'expense' && t.date && t.date.startsWith(curMonthStr)) {
            curMonthExpenseRon += parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        }
    });

    let dailyAvgRon = curMonthExpenseRon / daysElapsedInMonth;

    // Dacă luna curentă are mai puțin de 3 zile sau 0 cheltuieli, verificăm ultimele 30 de zile pentru o medie stabilă
    if (dailyAvgRon <= 0 || daysElapsedInMonth < 3) {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        let last30ExpenseRon = 0;
        let oldestDateInWindow = today.toISOString().split('T')[0];

        appData.transactions.forEach(t => {
            if (!isTxSuspended(t) && t.type === 'expense' && t.date && t.date >= thirtyDaysAgoStr) {
                last30ExpenseRon += parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                if (t.date < oldestDateInWindow) oldestDateInWindow = t.date;
            }
        });

        const d1 = new Date(oldestDateInWindow);
        const diffDays = Math.max(1, Math.ceil((today - d1) / (1000 * 60 * 60 * 24)));
        const recent30Avg = last30ExpenseRon / diffDays;

        if (recent30Avg > 0) {
            dailyAvgRon = recent30Avg;
        }
    }

    if (dailyAvgRon <= 0) {
        return 999;
    }

    const daysRunway = Math.round(totalBalRon / dailyAvgRon);
    return Math.max(0, daysRunway);
}

function updateHeaderRunwayWidget() {
    const daysEl = document.getElementById('headerRunwayDays');
    const unitEl = document.getElementById('headerRunwayUnit');
    const widgetEl = document.getElementById('headerRunwayWidget');
    if (!daysEl) return;

    const days = calculateGlobalRunwayDays();
    const activeLang = getLanguageForCurrency();
    const unitMap = {
        ro: 'ZILE',
        en: 'DAYS',
        de: 'TAGE',
        tr: 'GÜN',
        ja: '日',
        zh: '天'
    };
    const unitText = unitMap[activeLang] || 'ZILE';

    if (days >= 999) {
        daysEl.textContent = '999+';
        daysEl.style.fontSize = '0.78rem';
    } else {
        daysEl.textContent = String(days);
        daysEl.style.fontSize = '0.92rem';
    }
    if (unitEl) unitEl.textContent = unitText;

    if (widgetEl) {
        widgetEl.title = `Autonomie Financiară: ~${days} ${unitText.toLowerCase()} de rezervă cu banii actuali din cont.`;
    }
}

// Period Filter Helper
function filterTransactionsByPeriod(transactions, periodKey) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-11

    return transactions.filter(tx => {
        if (!tx.date || isTxSuspended(tx)) return false; // Exclude suspended
        const [y, m, d] = tx.date.split('-').map(Number);
        const txMonth = m - 1; // 0-11

        if (periodKey === 'current-month') {
            return y === curYear && txMonth === curMonth;
        } else if (periodKey === 'last-month') {
            const targetYear = curMonth === 0 ? curYear - 1 : curYear;
            const targetMonth = curMonth === 0 ? 11 : curMonth - 1;
            return y === targetYear && txMonth === targetMonth;
        } else if (periodKey === 'current-year') {
            return y === curYear;
        } else if (periodKey === 'all') {
            return true;
        }
        return true;
    });
}

function getPeriodLabel(periodKey) {
    const lang = getLanguageForCurrency();
    const months = I18N_DICTIONARY[lang]?.months || I18N_DICTIONARY['ro'].months;
    const now = new Date();
    if (periodKey === 'current-month') {
        return `${months[now.getMonth()]} ${now.getFullYear()}`;
    } else if (periodKey === 'last-month') {
        const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return `${months[prevM]} ${prevY}`;
    } else if (periodKey === 'current-year') {
        return `${t('year_prefix', lang)} ${new Date().getFullYear()}`;
    } else {
        return t('period_all', lang);
    }
}

// Render Main Donut Chart & Category Breakdown
function renderOverviewChartAndList() {
    const periodKey = document.getElementById('overviewPeriod').value;
    const periodTx = filterTransactionsByPeriod(appData.transactions, periodKey);
    const expenseTx = periodTx.filter(t => t.type === 'expense');

    // Aggregate by category
    const catMap = {};
    appData.categories.forEach(c => {
        catMap[c.id] = {
            category: c,
            totalRon: 0,
            count: 0
        };
    });

    let grandExpenseTotalRon = 0;
    expenseTx.forEach(t => {
        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        grandExpenseTotalRon += amtRon;
        if (catMap[t.categoryId]) {
            catMap[t.categoryId].totalRon = (catMap[t.categoryId].totalRon || 0) + amtRon;
            catMap[t.categoryId].count++;
        } else {
            // In case category was deleted or unknown
            if (!catMap['unknown']) {
                catMap['unknown'] = {
                    category: { id: 'unknown', name: 'Necunoscut', color: '#94a3b8', icon: '❓' },
                    totalRon: 0,
                    count: 0
                };
            }
            catMap['unknown'].totalRon = (catMap['unknown'].totalRon || 0) + amtRon;
            catMap['unknown'].count++;
        }
    });

    const mainCurr = getActiveCurrency();
    const grandExpenseTotal = convertFromRon(grandExpenseTotalRon, mainCurr);

    // Filter categories with totalRon > 0 and sort descending
    const activeCatList = Object.values(catMap)
        .filter(item => item.totalRon > 0)
        .map(item => ({
            ...item,
            total: convertFromRon(item.totalRon, mainCurr)
        }))
        .sort((a, b) => b.total - a.total);

    currentPeriodCategoryData = activeCatList;

    // Update center donut text (cifre pe randul principal, moneda sub cifre fara bold)
    const donutValEl = document.getElementById('donutTotalVal');
    const donutCurrEl = document.getElementById('donutTotalCurr');
    const num = parseFloat(grandExpenseTotal) || 0;
    const formattedDigits = num.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const currInfo = getCurrencyInfo(mainCurr);
    const currText = currInfo ? (currInfo.code || currInfo.symbol || mainCurr) : mainCurr;

    if (donutValEl) donutValEl.textContent = formattedDigits;
    if (donutCurrEl) donutCurrEl.textContent = currText;

    // Auto-scalare a cifrelor pentru a incapea oricat de multe cifre
    if (donutValEl) {
        if (formattedDigits.length > 14) {
            donutValEl.style.fontSize = '0.76rem';
        } else if (formattedDigits.length > 11) {
            donutValEl.style.fontSize = '0.84rem';
        } else if (formattedDigits.length > 8) {
            donutValEl.style.fontSize = '0.94rem';
        } else {
            donutValEl.style.fontSize = '1.05rem';
        }
    }

    // Render Breakdown list below chart
    const listEl = document.getElementById('overviewCategoryList');
    listEl.innerHTML = '';

    if (activeCatList.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg>
                <div>Nu sunt cheltuieli înregistrate în această perioadă.</div>
                <div style="font-size: 0.76rem; margin-top: 4px;">Apasă pe butonul "+ Cheltuială" pentru a adăuga.</div>
            </div>
        `;
    } else {
        activeCatList.forEach(item => {
            const pct = grandExpenseTotal > 0 ? ((item.total / grandExpenseTotal) * 100).toFixed(1) : '0.0';
            const row = document.createElement('div');
            row.className = 'category-row';
            row.title = 'Apasă pentru a deschide lista detaliată a cheltuielilor din această categorie';
            row.innerHTML = `
                <div class="category-meta">
                    <span class="cat-color-badge" style="background-color: ${item.category.color};"></span>
                    <span class="cat-icon-symbol">${item.category.icon || '🏷️'}</span>
                    <span class="cat-name">${item.category.name}</span>
                </div>
                <div class="category-stats">
                    <span class="cat-amount">${formatMoney(item.total, mainCurr)}</span>
                    <span class="cat-percent-badge">${pct}% (${item.count} ${t('ops_suffix')})</span>
                </div>
            `;
            row.addEventListener('click', () => {
                openCategoryDetailModal(item.category.id);
            });
            listEl.appendChild(row);
        });
    }

    // Randare Grafic Donut Dreptunghiular (Rectangular Donut Chart)
    drawRectangularDonutChart(activeCatList, grandExpenseTotal, mainCurr);
}

// Variabile de stare pentru interactiunea cu Donutul Dreptunghiular
let rectangularDonutSlices = [];
let rectangularDonutHoverIdx = -1;
let rectangularDonutListenersAttached = false;

// Algoritm de echilibrare a proportiilor vizuale (pastreaza ierarhia reala si asigura spatiu minim)
function getBalancedVisualWeights(catList, grandTotal) {
    const n = catList.length;
    if (n <= 1) return catList.map(() => 1.0);

    const rawShares = catList.map(c => Math.max(0, (c.total || 0)) / grandTotal);

    // Categoria cea mai mare este plafonata usor la max ~28-30% pentru a nu sufoca restul categoriilor,
    // pastrand insa strict ordinea marimilor: Concediu ramane mult mai mare decat Mancare, Mancare mai mare decat Facturi etc.
    const maxCap = Math.min(0.30, Math.max(0.22, 2.4 / n));
    const minFloor = Math.min(0.045, 0.8 / n);

    let weights = rawShares.map(p => {
        if (p > maxCap) {
            return maxCap + (p - maxCap) * 0.22;
        } else if (p < minFloor) {
            return minFloor;
        }
        return p;
    });

    let sum = weights.reduce((a, b) => a + b, 0);
    weights = weights.map(w => w / sum);

    return weights;
}

// Calibreaza culorile din grafic pentru a fi mai mate, placute si cu un contrast excelent
function getSoftChartColor(hexColor, isLight = true) {
    if (!hexColor || typeof hexColor !== 'string') return isLight ? '#94a3b8' : '#475569';
    let hex = hexColor.replace('#', '').trim();
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return hexColor;
    
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return hexColor;

    if (isLight) {
        // Nuanțe mai deschise și luminoase (mixam fin cu 42% alb)
        r = Math.round(r * 0.58 + 255 * 0.42);
        g = Math.round(g * 0.58 + 255 * 0.42);
        b = Math.round(b * 0.58 + 255 * 0.42);
    } else {
        // In Dark Mode, atenuam saturatia excesiva
        r = Math.round(r * 0.78 + 35 * 0.22);
        g = Math.round(g * 0.78 + 45 * 0.22);
        b = Math.round(b * 0.78 + 62 * 0.22);
    }
    return `rgb(${r}, ${g}, ${b})`;
}

function drawRectangularDonutChart(activeCatList, grandExpenseTotal, mainCurr) {
    const canvas = document.getElementById('overviewDonutChart');
    if (!canvas) return;

    if (donutChartInstance) {
        try { donutChartInstance.destroy(); } catch (e) {}
        donutChartInstance = null;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = rect.width || canvas.clientWidth || 360;
    const cssHeight = rect.height || canvas.clientHeight || 270;

    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const isLight = document.body.classList.contains('light-theme');
    const borderColor = isLight ? '#ffffff' : '#1e293b';

    // 1. Dreptunghi Exterior rotunjit fin
    const pad = 3;
    const x_0 = pad;
    const y_0 = pad;
    const x_1 = cssWidth - pad;
    const y_1 = cssHeight - pad;
    const ow = x_1 - x_0;
    const oh = y_1 - y_0;
    const rOut = 12;

    // 2. Centru CERC alb (diametru 126px, raza 63px - identic cu #donutCenterInfo)
    const cx = cssWidth / 2;
    const cy = cssHeight / 2;
    const Rin = 63;

    const W = ow;
    const H = oh;
    const P_rect = 2 * (W + H);

    // Functie care gaseste intersectia razei la unghiul 'angle' cu dreptunghiul exterior
    function getOuterPointByAngle(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        let tMin = Infinity;

        if (cos > 1e-7) {
            const t = (x_1 - cx) / cos;
            if (t > 0 && t < tMin) {
                const y = cy + t * sin;
                if (y >= y_0 - 1e-4 && y <= y_1 + 1e-4) tMin = t;
            }
        }
        if (cos < -1e-7) {
            const t = (x_0 - cx) / cos;
            if (t > 0 && t < tMin) {
                const y = cy + t * sin;
                if (y >= y_0 - 1e-4 && y <= y_1 + 1e-4) tMin = t;
            }
        }
        if (sin > 1e-7) {
            const t = (y_1 - cy) / sin;
            if (t > 0 && t < tMin) {
                const x = cx + t * cos;
                if (x >= x_0 - 1e-4 && x <= x_1 + 1e-4) tMin = t;
            }
        }
        if (sin < -1e-7) {
            const t = (y_0 - cy) / sin;
            if (t > 0 && t < tMin) {
                const x = cx + t * cos;
                if (x >= x_0 - 1e-4 && x <= x_1 + 1e-4) tMin = t;
            }
        }

        return { x: cx + tMin * cos, y: cy + tMin * sin };
    }

    // Pozitia 1D pe perimetrul dreptunghiului exterior (pornind din coltul stanga-sus (x_0, y_0))
    function getPerimeterL(pt) {
        const eps = 1.0;
        if (Math.abs(pt.y - y_0) <= eps) return Math.max(0, Math.min(W, pt.x - x_0));
        if (Math.abs(pt.x - x_1) <= eps) return W + Math.max(0, Math.min(H, pt.y - y_0));
        if (Math.abs(pt.y - y_1) <= eps) return W + H + Math.max(0, Math.min(W, x_1 - pt.x));
        if (Math.abs(pt.x - x_0) <= eps) return 2 * W + H + Math.max(0, Math.min(H, y_1 - pt.y));
        return 0;
    }

    // Unghiul de start: coltul stanga-sus
    const startAngle0 = Math.atan2(y_0 - cy, x_0 - cx);

    // Ponderi proportionale controlate (suma = 1)
    const visualWeights = getBalancedVisualWeights(activeCatList, grandExpenseTotal);

    rectangularDonutSlices = [];
    let currentAngle = startAngle0;

    activeCatList.forEach((item, idx) => {
        const visualWeight = visualWeights[idx];
        const sweepAngle = visualWeight * 2 * Math.PI;
        const theta_1 = currentAngle;
        const theta_2 = currentAngle + sweepAngle;
        currentAngle = theta_2;

        const pOut1 = getOuterPointByAngle(theta_1);
        const pOut2 = getOuterPointByAngle(theta_2);

        const L1 = getPerimeterL(pOut1);
        let L2 = getPerimeterL(pOut2);
        if (L2 <= L1) L2 += P_rect;

        // Adaugam colturile dreptunghiului exterior care se afla intre L1 si L2
        const cornerCandidates = [
            { L: 0, x: x_0, y: y_0 },
            { L: W, x: x_1, y: y_0 },
            { L: W + H, x: x_1, y: y_1 },
            { L: 2 * W + H, x: x_0, y: y_1 },
            { L: 2 * W + 2 * H, x: x_0, y: y_0 }
        ];

        const outerPoints = [pOut1];
        cornerCandidates.forEach(c => {
            let cL = c.L;
            if (cL <= L1 && cL + P_rect < L2) cL += P_rect;
            if (cL > L1 && cL < L2) {
                outerPoints.push({ x: c.x, y: c.y });
            }
        });
        outerPoints.push(pOut2);

        // Puncte pe cercul interior:
        const pIn1 = { x: cx + Rin * Math.cos(theta_1), y: cy + Rin * Math.sin(theta_1) };
        const pIn2 = { x: cx + Rin * Math.cos(theta_2), y: cy + Rin * Math.sin(theta_2) };

        // Construim Path2D
        const path = new Path2D();
        path.moveTo(outerPoints[0].x, outerPoints[0].y);
        for (let i = 1; i < outerPoints.length; i++) {
            path.lineTo(outerPoints[i].x, outerPoints[i].y);
        }
        // Conectam cu cercul interior la theta_2
        path.lineTo(pIn2.x, pIn2.y);
        // Arc pe cercul interior inapoi pana la theta_1 (counter-clockwise)
        path.arc(cx, cy, Rin, theta_2, theta_1, true);
        path.closePath();

        // Poligon complet pentru Point-in-Polygon si determinare centru
        const polygon = [...outerPoints];
        const arcSteps = 10;
        for (let s = 0; s <= arcSteps; s++) {
            const a = theta_2 - (s / arcSteps) * (theta_2 - theta_1);
            polygon.push({ x: cx + Rin * Math.cos(a), y: cy + Rin * Math.sin(a) });
        }

        let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
        polygon.forEach(pt => {
            if (pt.x < bMinX) bMinX = pt.x;
            if (pt.x > bMaxX) bMaxX = pt.x;
            if (pt.y < bMinY) bMinY = pt.y;
            if (pt.y > bMaxY) bMaxY = pt.y;
        });

        const midAngle = (theta_1 + theta_2) / 2;
        const pOutMid = getOuterPointByAngle(midAngle);
        const pInMid = { x: cx + Rin * Math.cos(midAngle), y: cy + Rin * Math.sin(midAngle) };
        const distOut = Math.hypot(pOutMid.x - cx, pOutMid.y - cy);
        const deltaR = distOut - Rin;
        const rayMidX = (pInMid.x + pOutMid.x) / 2;
        const rayMidY = (pInMid.y + pOutMid.y) / 2;

        const realPct = (item.total / grandExpenseTotal) * 100;

        rectangularDonutSlices.push({
            idx,
            item,
            pct: realPct,
            theta_1,
            theta_2,
            midAngle,
            pIn1,
            pIn2,
            pOut1,
            pOut2,
            distOut,
            deltaR,
            rayMidX,
            rayMidY,
            boxCenterX: (bMinX + bMaxX) / 2,
            boxCenterY: (bMinY + bMaxY) / 2,
            bMinX,
            bMaxX,
            bMinY,
            bMaxY,
            polygon,
            path
        });
    });

    // 1. Decupam totul in DREPTUNGHIUL exterior rotunjit fin
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x_0, y_0, ow, oh, rOut);
    } else {
        ctx.rect(x_0, y_0, ow, oh);
    }
    ctx.clip();

    // 2. Desenam feliile categoriilor cu culorile calibrate mai mate / luminoase
    rectangularDonutSlices.forEach((slice, idx) => {
        const baseColor = slice.item.category.color;
        ctx.fillStyle = getSoftChartColor(baseColor, isLight);
        ctx.fill(slice.path);
        if (idx === rectangularDonutHoverIdx) {
            ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.22)';
            ctx.fill(slice.path);
        }
    });

    // 3. Separatoare intre categorii - RADIALE, STRICT PERPENDICULARE pe cercul alb
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    rectangularDonutSlices.forEach(slice => {
        ctx.beginPath();
        ctx.moveTo(slice.pIn1.x, slice.pIn1.y);
        ctx.lineTo(slice.pOut1.x, slice.pOut1.y);
        ctx.stroke();
    });

    ctx.restore();

    // 3.5. Contur Exterior Fin pentru Donut (Outer Border)
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x_0, y_0, ow, oh, rOut);
    } else {
        ctx.rect(x_0, y_0, ow, oh);
    }
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 4. Centrul CERC alb al lui TOTAL LUNA (se unesc feliile fix de el)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, Rin, 0, 2 * Math.PI);
    ctx.fillStyle = isLight ? '#ffffff' : '#1e293b';
    ctx.fill();
    ctx.strokeStyle = isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 5. Etichetele categoriilor:
    // Identificam feliile cu adevărat mici (< 10%) din partea de jos care pot necesita distantare alternată
    const smallBottomSlices = rectangularDonutSlices.filter(s => {
        return s.pct < 10 && s.midAngle >= 0.8 && s.midAngle <= 2.35;
    });
    smallBottomSlices.sort((a, b) => a.boxCenterX - b.boxCenterX);

    rectangularDonutSlices.forEach(slice => {
        const cat = slice.item.category;
        const nameText = cat.name || '';
        const pctText = `${slice.pct.toFixed(0)}%`;
        const label = `${nameText} ${pctText}`;

        ctx.save();
        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let labelX = slice.rayMidX;
        let labelY = slice.rayMidY;

        // Folosim centroidul geometric exact al poligonului pentru centrare perfecta in cardul feliei
        const centroid = getPolygonCentroid(slice.polygon);
        if (centroid && isPointInPolygon(centroid.x, centroid.y, slice.polygon)) {
            labelX = centroid.x;
            labelY = centroid.y;
        }

        if (smallBottomSlices.includes(slice)) {
            // Pentru feliile foarte mici din partea de jos: alternam pe raza pentru a evita orice suprapunere
            const bIdx = smallBottomSlices.indexOf(slice);
            const rFactor = (bIdx % 2 === 0) ? 0.65 : 0.42;
            const rTarget = Rin + rFactor * slice.deltaR;
            labelX = cx + rTarget * Math.cos(slice.midAngle);
            labelY = cy + rTarget * Math.sin(slice.midAngle);
            ctx.font = "bold 12px 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";
        } else {
            // Categoriile normale/mari: centrate perfect in felie
            const fontSize = slice.pct > 20 ? 14.5 : (slice.pct > 6 ? 13 : 11.5);
            ctx.font = `bold ${fontSize}px 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
        }

        ctx.fillText(label, labelX, labelY);
        ctx.restore();
    });

    // 6. Atasam ascultatorii de evenimente daca nu sunt deja activi
    if (!rectangularDonutListenersAttached) {
        attachRectangularDonutListeners(canvas);
        rectangularDonutListenersAttached = true;
    }
}

// Functie de calcul al centroidului geometric al unui poligon 2D
function getPolygonCentroid(pts) {
    if (!pts || pts.length < 3) return null;
    let area = 0;
    let cx = 0;
    let cy = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const cross = pts[i].x * pts[j].y - pts[j].x * pts[i].y;
        area += cross;
        cx += (pts[i].x + pts[j].x) * cross;
        cy += (pts[i].y + pts[j].y) * cross;
    }
    area = area / 2;
    if (Math.abs(area) < 1e-4) return null;
    return {
        x: cx / (6 * area),
        y: cy / (6 * area)
    };
}

// Functie pura de testare punct in poligon (robusta pe orice ecran / DPR)
function isPointInPolygon(px, py, poly) {
    if (!poly || poly.length < 3) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        const intersect = ((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function attachRectangularDonutListeners(canvas) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    let lastTouchHandledTime = 0;

    function getCanvasCoords(e) {
        const r = canvas.getBoundingClientRect();
        const clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX :
                        (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientX : e.clientX;
        const clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY :
                        (e.changedTouches && e.changedTouches.length > 0) ? e.changedTouches[0].clientY : e.clientY;
        return {
            x: clientX - r.left,
            y: clientY - r.top
        };
    }

    function findSliceAt(coords) {
        for (let i = 0; i < rectangularDonutSlices.length; i++) {
            const s = rectangularDonutSlices[i];
            if (s.polygon && isPointInPolygon(coords.x, coords.y, s.polygon)) {
                return s;
            }
        }
        return null;
    }

    function handleSelectSlice(e) {
        const coords = getCanvasCoords(e);
        const slice = findSliceAt(coords);
        if (slice && slice.item && slice.item.category) {
            openCategoryDetailModal(slice.item.category.id);
        }
    }

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchMoved = false;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
            const dx = Math.abs(e.touches[0].clientX - touchStartX);
            const dy = Math.abs(e.touches[0].clientY - touchStartY);
            // Daca degetul s-a miscat peste 8px, este un gest de swipe/scroll/refresh, NU un click/tap
            if (dx > 8 || dy > 8) {
                touchMoved = true;
            }
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        // Daca utilizatorul a facut swipe/scroll/refresh, ignoram complet
        if (touchMoved) {
            return;
        }
        lastTouchHandledTime = Date.now();
        handleSelectSlice(e);
    }, { passive: true });

    canvas.addEventListener('click', (e) => {
        // Ignoram click-ul sintetic generat de browser imediat dupa touchend
        if (Date.now() - lastTouchHandledTime < 500) {
            return;
        }
        handleSelectSlice(e);
    });

    canvas.addEventListener('mousemove', (e) => {
        const coords = getCanvasCoords(e);
        const slice = findSliceAt(coords);
        const newHoverIdx = slice ? slice.idx : -1;
        if (newHoverIdx !== rectangularDonutHoverIdx) {
            rectangularDonutHoverIdx = newHoverIdx;
            canvas.style.cursor = slice ? 'pointer' : 'default';

            const periodKey = document.getElementById('overviewPeriod')?.value || 'current-month';
            const periodTx = filterTransactionsByPeriod(appData.transactions, periodKey);
            const expenseTx = periodTx.filter(t => t.type === 'expense');
            const mainCurr = getActiveCurrency();
            let grandExpenseTotal = 0;
            expenseTx.forEach(t => grandExpenseTotal += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));
            const convertedGrandExpense = convertFromRon(grandExpenseTotal, mainCurr);
            const activeList = rectangularDonutSlices.map(s => s.item);
            drawRectangularDonutChart(activeList, convertedGrandExpense, mainCurr);
        }
    });

    canvas.addEventListener('mouseleave', () => {
        if (rectangularDonutHoverIdx !== -1) {
            rectangularDonutHoverIdx = -1;
            canvas.style.cursor = 'default';

            const periodKey = document.getElementById('overviewPeriod')?.value || 'current-month';
            const periodTx = filterTransactionsByPeriod(appData.transactions, periodKey);
            const expenseTx = periodTx.filter(t => t.type === 'expense');
            const mainCurr = getActiveCurrency();
            let grandExpenseTotal = 0;
            expenseTx.forEach(t => grandExpenseTotal += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));
            const convertedGrandExpense = convertFromRon(grandExpenseTotal, mainCurr);
            const activeList = rectangularDonutSlices.map(s => s.item);
            drawRectangularDonutChart(activeList, convertedGrandExpense, mainCurr);
        }
    });

    // Redesenare la redimensionarea ecranului sau rotirea telefonului
    window.addEventListener('resize', () => {
        if (document.getElementById('overviewDonutChart')) {
            renderOverviewChartAndList();
        }
    });
}


let currentDetailCategoryId = null;
let currentExportData = {
    title: '',
    text: '',
    filename: ''
};

// Modal Drill-down: Click pe categorie/felie grafic
function openCategoryDetailModal(categoryId) {
    currentDetailCategoryId = categoryId;
    const category = appData.categories.find(c => c.id === categoryId) || {
        id: categoryId,
        name: 'Categorie',
        color: '#3b82f6',
        icon: '🏷️'
    };

    const periodKey = document.getElementById('overviewPeriod').value;
    const periodTx = filterTransactionsByPeriod(appData.transactions, periodKey);
    const categoryTx = periodTx.filter(t => t.type === 'expense' && t.categoryId === categoryId);

    // Sort by date descending
    categoryTx.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);

    const mainCurr = getActiveCurrency();
    let totalSpent = 0;
    categoryTx.forEach(t => totalSpent += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));

    let allPeriodExpenseTotal = 0;
    periodTx.filter(t => t.type === 'expense').forEach(t => allPeriodExpenseTotal += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));

    const percent = allPeriodExpenseTotal > 0 ? ((totalSpent / allPeriodExpenseTotal) * 100).toFixed(1) : '0';

    applyLanguage();

    // Populate modal
    document.getElementById('drilldownCategoryName').textContent = `${category.icon || ''} ${category.name}`;
    document.getElementById('drilldownColorDot').style.backgroundColor = category.color;
    document.getElementById('drilldownPeriodLabel').textContent = getPeriodLabel(periodKey);
    document.getElementById('drilldownTotalSpent').textContent = formatMoney(convertFromRon(totalSpent, mainCurr), mainCurr);
    document.getElementById('drilldownPercentLabel').textContent = `(${percent}% ${t('lbl_of_period_expenses')})`;

    const listEl = document.getElementById('drilldownTransactionsList');
    listEl.innerHTML = '';

    if (categoryTx.length === 0) {
        listEl.innerHTML = `<div class="empty-state">${t('empty_category_expenses')}</div>`;
    } else {
        categoryTx.forEach(tx => {
            const isSuspended = isTxSuspended(tx);
            const mc = getTransactionMerchantAndComment(tx);
            const mainTitle = category.name;
            const itemIcon = category.icon || '🏷️';

            const commentText = (mc.comment || '').trim();
            const commentRowHtml = commentText ? `
                <div class="tx-row-comment">
                    <span class="tx-comment-icon">💬</span>
                    <span class="tx-comment-text">${escapeHtml(commentText)}</span>
                </div>
            ` : '';

            let merchantBadgeHtml = '';
            if (mc.merchant) {
                merchantBadgeHtml = `<span class="tx-store-badge">${getMerchantLogoHtml(mc.merchant, 14)} <span>${escapeHtml(mc.merchant)}</span></span>`;
            }

            const amountBlockHtml = formatTransactionAmountHtml(tx, mainCurr, true);
            const suspendedBadgeHtml = isSuspended ? `<span class="tx-suspended-badge">⏸️ Suspendat</span>` : '';

            const payMethod = (tx.paymentMethod === 'cash') ? 'cash' : 'card';
            const payBadgeHtml = payMethod === 'cash'
                ? `<span class="tx-pay-badge cash">💵 Cash</span>`
                : `<span class="tx-pay-badge card">💳 Card</span>`;

            const suspendIconSvg = isSuspended
                ? `<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M8 5v14l11-7z"/></svg>`
                : `<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            const suspendTitle = isSuspended ? 'Reactivează cheltuiala' : 'Suspendă cheltuiala';
            const suspendBtnClass = 'tx-suspend-btn' + (isSuspended ? ' active' : '');
            const timeStr = getTransactionTimeDisplay(tx);
            const timeDisp = timeStr ? ` • ⏰ ${timeStr}` : '';

            const item = document.createElement('div');
            item.className = 'tx-item' + (isSuspended ? ' tx-suspended' : '');
            item.innerHTML = `
                <div class="tx-row-top">
                    <div class="tx-desc-wrap">
                        <span class="tx-icon">${itemIcon}</span>
                        <span class="tx-main-title" style="color:${category.color};">${escapeHtml(mainTitle)}</span>
                        ${suspendedBadgeHtml}
                    </div>
                    <div class="tx-amount-wrap">
                        ${amountBlockHtml}
                    </div>
                </div>
                <div class="tx-row-middle">
                    <span class="tx-date">📅 ${formatDateDisplay(tx.date)}${timeDisp}</span>
                    ${payBadgeHtml}
                </div>
                ${commentRowHtml}
                <div class="tx-row-bottom">
                    <div class="tx-merchant-wrap">
                        ${merchantBadgeHtml}
                    </div>
                    <div class="tx-buttons-wrap">
                        <button class="${suspendBtnClass}" title="${suspendTitle}" data-txid="${tx.id}">
                            ${suspendIconSvg}
                        </button>
                        <button class="tx-edit-btn" title="Modifică" data-txid="${tx.id}">
                            <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                        </button>
                        <button class="tx-del-btn" title="Șterge" data-txid="${tx.id}">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </div>
            `;

            item.querySelector('.tx-suspend-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSuspendTransaction(tx.id);
                openCategoryDetailModal(categoryId);
            });
            item.querySelector('.tx-edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditExpenseModal(tx);
            });
            item.querySelector('.tx-del-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Sigur doriți să ștergeți această cheltuială?')) {
                    deleteTransaction(tx.id);
                    openCategoryDetailModal(categoryId); // refresh current modal
                }
            });
            listEl.appendChild(item);
        });
    }

    openModal('modalCategoryDetails');
}

// ==========================================
// EXPORT CHELTUIELI PE CATEGORII & DETALII
// ==========================================

function getPeriodReadableName(periodKey) {
    const lang = getLanguageForCurrency();
    const months = I18N_DICTIONARY[lang]?.months || I18N_DICTIONARY['ro'].months;
    const now = new Date();
    if (periodKey === 'current-month') {
        return `${t('period_current_month', lang)} (${months[now.getMonth()]} ${now.getFullYear()})`;
    } else if (periodKey === 'last-month') {
        const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${t('period_last_month', lang)} (${months[lastM.getMonth()]} ${lastM.getFullYear()})`;
    } else if (periodKey === 'current-year') {
        return `${t('period_current_year', lang)} (${now.getFullYear()})`;
    } else {
        return t('period_all', lang);
    }
}

// 1. Export TOATE Categoriile (de la butonul "Categorii" de deasupra graficului)
function openExportAllCategoriesModal() {
    const periodKey = document.getElementById('overviewPeriod')?.value || 'current-month';
    const periodTx = filterTransactionsByPeriod(appData.transactions, periodKey);
    const expenseTx = periodTx.filter(t => t.type === 'expense');
    const mainCurr = getActiveCurrency();
    const lang = getLanguageForCurrency();
    const periodName = getPeriodReadableName(periodKey);

    let grandTotalRon = 0;
    expenseTx.forEach(t => grandTotalRon += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));
    const grandTotalCurr = convertFromRon(grandTotalRon, mainCurr);

    const activeCatList = (currentPeriodCategoryData && currentPeriodCategoryData.length > 0)
        ? currentPeriodCategoryData
        : appData.categories.map(cat => {
            const txs = expenseTx.filter(t => t.categoryId === cat.id);
            let catTotalRon = 0;
            txs.forEach(t => catTotalRon += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));
            return {
                category: cat,
                total: convertFromRon(catTotalRon, mainCurr),
                count: txs.length
            };
        }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

    const now = new Date();
    const localeMap = { ro: 'ro-RO', en: 'en-US', de: 'de-DE', tr: 'tr-TR', ja: 'ja-JP', zh: 'zh-CN' };
    const nowStr = now.toLocaleDateString(localeMap[lang] || 'en-US');

    let text = `═══════════════════════════════\n`;
    text += `   ${t('export_header_categories', lang)}\n`;
    text += `═══════════════════════════════\n`;
    text += `${t('export_lbl_period', lang)}: ${periodName}\n`;
    text += `${t('export_lbl_date', lang)}: ${nowStr}\n`;
    text += `${t('currency_label', lang)}: ${mainCurr}\n\n`;
    text += `TOTAL: ${formatMoney(grandTotalCurr, mainCurr)}\n`;
    text += `───────────────────────────────\n`;
    text += `${t('categories_list_title', lang).toUpperCase()}:\n`;

    if (activeCatList.length === 0) {
        text += `${t('empty_category_expenses', lang)}\n`;
    } else {
        activeCatList.forEach((item, idx) => {
            const pct = grandTotalCurr > 0 ? ((item.total / grandTotalCurr) * 100).toFixed(1) : '0.0';
            const countStr = item.count ? `${item.count} ${t('ops_suffix', lang)}` : '';
            text += `${idx + 1}. ${item.category.name}: ${formatMoney(item.total, mainCurr)} (${pct}%${countStr ? ' • ' + countStr : ''})\n`;
        });
    }

    text += `───────────────────────────────\n`;
    text += `${t('export_lbl_generated', lang)} MoneyApp v${APP_VERSION}\n`;

    const title = `${t('export_btn', lang)}: ${t('expenses_by_cat', lang)}`;
    const cleanDate = nowStr.replace(/[\.\/]/g, '-');
    const filename = `MoneyApp_Categories_${cleanDate}.txt`;

    currentExportData = {
        title: title,
        text: text,
        filename: filename
    };

    const titleEl = document.getElementById('exportModalTitleText');
    if (titleEl) titleEl.textContent = title;
    const previewEl = document.getElementById('exportTextPreview');
    if (previewEl) previewEl.value = text;

    openModal('modalExportData');
}

// 2. Export CATEGORIE Individuală (de la butonul mic "Export" din Detalii Categorie)
function openExportSingleCategoryModal(categoryId) {
    const catId = categoryId || currentDetailCategoryId;
    if (!catId) return;

    const lang = getLanguageForCurrency();
    const category = appData.categories.find(c => c.id === catId) || {
        name: t('tab_categories', lang),
        icon: '🏷️'
    };

    const periodKey = document.getElementById('overviewPeriod')?.value || 'current-month';
    const periodTx = filterTransactionsByPeriod(appData.transactions, periodKey);
    const categoryTx = periodTx.filter(t => t.type === 'expense' && t.categoryId === catId);
    categoryTx.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);

    const mainCurr = getActiveCurrency();
    const periodName = getPeriodReadableName(periodKey);

    let totalSpentRon = 0;
    categoryTx.forEach(t => totalSpentRon += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));
    const totalSpentCurr = convertFromRon(totalSpentRon, mainCurr);

    let allExpenseRon = 0;
    periodTx.filter(t => t.type === 'expense').forEach(t => allExpenseRon += (parseFloat(t.amountInRon) || parseFloat(t.amount) || 0));
    const percent = allExpenseRon > 0 ? ((totalSpentRon / allExpenseRon) * 100).toFixed(1) : '0';

    const now = new Date();
    const localeMap = { ro: 'ro-RO', en: 'en-US', de: 'de-DE', tr: 'tr-TR', ja: 'ja-JP', zh: 'zh-CN' };
    const nowStr = now.toLocaleDateString(localeMap[lang] || 'en-US');

    let text = `═══════════════════════════════\n`;
    text += `  ${t('tab_categories', lang).toUpperCase()}: ${category.name.toUpperCase()}\n`;
    text += `═══════════════════════════════\n`;
    text += `${t('export_lbl_period', lang)}: ${periodName}\n`;
    text += `${t('lbl_total_spent', lang)}: ${formatMoney(totalSpentCurr, mainCurr)} (${percent}% ${t('export_lbl_of_total', lang)})\n`;
    text += `${t('stat_activity_vol', lang)}: ${categoryTx.length} ${t('ops_suffix', lang)}\n`;
    text += `${t('currency_label', lang)}: ${mainCurr}\n`;
    text += `───────────────────────────────\n`;
    text += `${t('export_lbl_tx_history', lang).toUpperCase()}:\n`;

    if (categoryTx.length === 0) {
        text += `${t('empty_category_expenses', lang)}\n`;
    } else {
        categoryTx.forEach((tx) => {
            const d = new Date(tx.date);
            const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString(localeMap[lang] || 'en-US') : tx.date;
            const amt = convertFromRon(parseFloat(tx.amountInRon) || parseFloat(tx.amount) || 0, mainCurr);
            const desc = tx.description ? ` - ${tx.description}` : '';
            text += `• ${dateStr}: ${formatMoney(amt, mainCurr)}${desc}\n`;
        });
    }

    text += `───────────────────────────────\n`;
    text += `${t('export_lbl_generated', lang)} MoneyApp v${APP_VERSION}\n`;

    const title = `${t('export_btn', lang)}: ${category.name}`;
    const cleanCatName = category.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanDate = nowStr.replace(/[\.\/]/g, '-');
    const filename = `MoneyApp_${cleanCatName}_${cleanDate}.txt`;

    currentExportData = {
        title: title,
        text: text,
        filename: filename
    };

    const titleEl = document.getElementById('exportModalTitleText');
    if (titleEl) titleEl.textContent = title;
    const previewEl = document.getElementById('exportTextPreview');
    if (previewEl) previewEl.value = text;

    openModal('modalExportData');
}

// 3. Executare Copiere Text
function copyExportText() {
    const text = currentExportData.text || document.getElementById('exportTextPreview')?.value || '';
    if (!text) return;

    if (window.AndroidBridge && typeof window.AndroidBridge.copyToClipboard === 'function') {
        window.AndroidBridge.copyToClipboard(text);
        showToast(t('export_copied_toast') || 'Text copiat în clipboard!', 'success');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(t('export_copied_toast') || 'Text copiat în clipboard!', 'success');
        }).catch(() => {
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }

    function fallbackCopy(str) {
        const textarea = document.getElementById('exportTextPreview');
        if (textarea) {
            textarea.select();
            document.execCommand('copy');
            showToast(t('export_copied_toast') || 'Text copiat în clipboard!', 'success');
        }
    }
}

// 4. Executare WhatsApp Share
function shareExportWhatsApp() {
    const text = currentExportData.text || document.getElementById('exportTextPreview')?.value || '';
    if (!text) return;

    if (window.AndroidBridge && typeof window.AndroidBridge.shareTextWhatsApp === 'function') {
        window.AndroidBridge.shareTextWhatsApp(text);
        return;
    }

    // Web Browser fallback
    const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
}

// 5. Executare Printează / PDF
function printExportDocument() {
    const title = currentExportData.title || 'Raport MoneyApp';
    const text = currentExportData.text || document.getElementById('exportTextPreview')?.value || '';
    if (!text) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <style>
                @page { size: auto; margin: 12mm; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 16px; color: #0f172a; line-height: 1.5; font-size: 13px; }
                h1 { font-size: 18px; margin-bottom: 8px; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
                pre { font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.55; white-space: pre-wrap; background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; }
                .footer { margin-top: 16px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <pre>${text}</pre>
            <div class="footer">Tipărit din MoneyApp • ${new Date().toLocaleDateString('ro-RO')} ${new Date().toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}</div>
        </body>
        </html>
    `;

    if (window.AndroidBridge && typeof window.AndroidBridge.printHtml === 'function') {
        window.AndroidBridge.printHtml(htmlContent, title);
        return;
    }

    // Web browser fallback
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
        try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        } catch (e) {
            window.print();
        }
        setTimeout(() => printFrame.remove(), 2500);
    }, 350);
}

// 6. Executare Descarcă .txt
function downloadExportFile() {
    const text = currentExportData.text || document.getElementById('exportTextPreview')?.value || '';
    if (!text) return;
    const filename = currentExportData.filename || 'MoneyApp_Export.txt';

    if (window.AndroidBridge && typeof window.AndroidBridge.shareFile === 'function') {
        window.AndroidBridge.shareFile(text, filename, 'text/plain');
        return;
    } else if (window.AndroidBridge && typeof window.AndroidBridge.saveTextFile === 'function') {
        window.AndroidBridge.saveTextFile(text, filename);
        return;
    }

    // Web browser fallback
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(t('export_downloaded_toast') || 'Fișier descărcat cu succes!', 'success');
}

// Delete Transaction
function deleteTransaction(txId) {
    appData.transactions = appData.transactions.filter(t => t.id !== txId);
    saveData();
    updateBalanceCards();
    renderOverviewChartAndList();
    renderTransactionsHistory();
    renderStatsTab();
    updateSuspendedTxBadge();
    const modalSusp = document.getElementById('modalSuspendedTransactions');
    if (modalSusp && modalSusp.classList.contains('active')) {
        renderSuspendedTransactionsList();
    }
    const modalBills = document.getElementById('modalBillsAnalytics');
    if (modalBills && modalBills.classList.contains('active')) {
        renderBillsAnalytics();
    }
    showToast('Tranzacție ștearsă cu succes.', 'success');
}

// Calcul numar saptamana ISO si interval calendaristic
function getIsoWeek(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        return { weekNo: 0, year: 2026, key: 'unknown', badge: 'S-', range: '' };
    }
    const parts = dateStr.split('-');
    if (parts.length < 3) {
        return { weekNo: 0, year: 2026, key: 'unknown', badge: 'S-', range: '' };
    }
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    const date = new Date(Date.UTC(y, m, d));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    const isoYear = date.getUTCFullYear();

    const dayOfWeek = new Date(y, m, d).getDay(); // 0 = Sun, 1 = Mon
    const diffToMon = (dayOfWeek + 6) % 7;
    const mon = new Date(y, m, d - diffToMon);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const pad = n => String(n).padStart(2, '0');
    const rangeStr = `${pad(mon.getDate())}.${pad(mon.getMonth() + 1)} – ${pad(sun.getDate())}.${pad(sun.getMonth() + 1)}.${sun.getFullYear()}`;

    return {
        weekNo,
        year: isoYear,
        key: `${isoYear}-W${pad(weekNo)}`,
        badge: `S${weekNo}`,
        range: rangeStr
    };
}

function escapeRegex(string) {
    if (!string) return '';
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

// Extrage inteligent magazinul și descrierea/comentariul unei tranzacții
function getTransactionMerchantAndComment(tx) {
    if (!tx) return { merchant: '', comment: '' };
    if (tx.merchant && tx.merchant.trim().length > 0) {
        return { merchant: tx.merchant.trim(), comment: (tx.description || '').trim() };
    }
    // Compatibilitate retroactivă pentru tranzacții anterioare unde magazinul era scris în descriere
    if (tx.type === 'expense' && tx.description) {
        const descTrim = tx.description.trim();
        const detected = detectMerchantFromTransaction(tx);
        if (detected && detected.name) {
            const regex = new RegExp(`^${escapeRegex(detected.name)}\\s*[-:–]?\\s*`, 'i');
            if (regex.test(descTrim)) {
                const remainder = descTrim.replace(regex, '').trim();
                return { merchant: detected.name, comment: remainder };
            }
            if (descTrim.toLowerCase() === detected.name.toLowerCase()) {
                return { merchant: detected.name, comment: '' };
            }
        }
    }
    return { merchant: '', comment: (tx.description || '').trim() };
}

// Render Transactions Tab (History) cu separare pe saptamani
function renderTransactionsHistory() {
    updateSuspendedTxBadge();
    const listEl = document.getElementById('allTransactionsList');
    const filterType = document.getElementById('filterTxType')?.value || 'all';
    const rawQuery = document.getElementById('searchTxInput')?.value || '';
    const query = normalizeDiacritics(rawQuery);

    let list = [...appData.transactions];

    if (filterType !== 'all') {
        list = list.filter(t => t.type === filterType);
    }

    if (query) {
        list = list.filter(t => {
            const mc = getTransactionMerchantAndComment(t);
            const desc = normalizeDiacritics(mc.comment || '');
            const merch = normalizeDiacritics(mc.merchant || '');
            const origDesc = normalizeDiacritics(t.description || '');
            const cat = appData.categories.find(c => c.id === t.categoryId);
            const catName = normalizeDiacritics(cat ? cat.name : '');
            return desc.includes(query) || merch.includes(query) || origDesc.includes(query) || catName.includes(query);
        });
    }

    // Sort descending by date & created time
    list.sort((a, b) => new Date(b.date) - new Date(a.date) || (b.createdAt || 0) - (a.createdAt || 0));

    // Calcul Total Bonuri / Tranzacții filtrate (afișate)
    const mainCurr = getActiveCurrency();
    let filteredExpenseRon = 0;
    let filteredIncomeRon = 0;
    let filteredTransferRon = 0;
    list.forEach(tx => {
        if (isTxSuspended(tx)) return;
        const amtRon = parseFloat(tx.amountInRon) || parseFloat(tx.amount) || 0;
        if (tx.type === 'expense') filteredExpenseRon += amtRon;
        else if (tx.type === 'income') filteredIncomeRon += amtRon;
        else if (tx.type === 'transfer') filteredTransferRon += amtRon;
    });

    let displayTotalRon = filteredExpenseRon;
    if (filterType === 'income') {
        displayTotalRon = filteredIncomeRon;
    } else if (filterType === 'transfer') {
        displayTotalRon = filteredTransferRon;
    } else if (filteredExpenseRon === 0 && filteredIncomeRon > 0) {
        displayTotalRon = filteredIncomeRon;
    }

    const totalValEl = document.getElementById('txSearchTotalVal');
    if (totalValEl) {
        const convertedTotal = convertFromRon(displayTotalRon, mainCurr);
        const num = parseFloat(convertedTotal || 0);
        const isNeg = num < 0;
        const absStr = Math.abs(num).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const parts = absStr.split(',');
        const intPart = (isNeg ? '-' : '') + parts[0];
        const decPart = parts[1] || '00';
        totalValEl.innerHTML = `<span class="bal-int">${intPart}</span><span class="bal-dec">,${decPart}</span> <span class="bal-curr">${mainCurr}</span>`;
    }

    listEl.innerHTML = '';

    if (list.length === 0) {
        listEl.innerHTML = '<div class="empty-state">Nu a fost găsită nicio tranzacție conform filtrelor.</div>';
        return;
    }

    // Calcul totaluri saptamanale pentru separatoare
    const weekTotals = {};
    list.forEach(tx => {
        if (isTxSuspended(tx)) return;
        const w = getIsoWeek(tx.date);
        if (!weekTotals[w.key]) {
            weekTotals[w.key] = { expenseRon: 0, incomeRon: 0 };
        }
        const amtRon = parseFloat(tx.amountInRon) || parseFloat(tx.amount) || 0;
        if (tx.type === 'expense') weekTotals[w.key].expenseRon += amtRon;
        else if (tx.type === 'income') weekTotals[w.key].incomeRon += amtRon;
    });

    let currentWeekKey = null;
    let currentWeekItemsEl = null;
    const collapsedWeeks = (appData.settings && Array.isArray(appData.settings.collapsedWeeks)) ? appData.settings.collapsedWeeks : [];

    list.forEach(tx => {
        const w = getIsoWeek(tx.date);
        if (w.key !== currentWeekKey) {
            currentWeekKey = w.key;
            const isCollapsed = collapsedWeeks.includes(w.key);

            const sep = document.createElement('div');
            sep.className = 'tx-week-separator' + (isCollapsed ? ' is-collapsed' : '');
            sep.dataset.weekKey = w.key;
            sep.setAttribute('role', 'button');
            sep.setAttribute('tabindex', '0');
            sep.setAttribute('title', isCollapsed ? 'Apasă pentru a deschide săptămâna' : 'Apasă pentru a ascunde tranzacțiile săptămânii');

            const wTotals = weekTotals[w.key] || { expenseRon: 0, incomeRon: 0 };
            let totalDisp = '';
            if (wTotals.expenseRon > 0 && wTotals.incomeRon > 0) {
                const expDisp = formatMoney(convertFromRon(wTotals.expenseRon, mainCurr), mainCurr);
                const incDisp = formatMoney(convertFromRon(wTotals.incomeRon, mainCurr), mainCurr);
                totalDisp = `<span class="tx-week-sum">-${expDisp}</span><span class="tx-week-sum income">+${incDisp}</span>`;
            } else if (wTotals.expenseRon > 0) {
                const expDisp = formatMoney(convertFromRon(wTotals.expenseRon, mainCurr), mainCurr);
                totalDisp = `<span class="tx-week-sum">-${expDisp}</span>`;
            } else if (wTotals.incomeRon > 0) {
                const incDisp = formatMoney(convertFromRon(wTotals.incomeRon, mainCurr), mainCurr);
                totalDisp = `<span class="tx-week-sum income">+${incDisp}</span>`;
            }

            sep.innerHTML = `
                <div class="tx-week-top-row">
                    <div class="tx-week-info">
                        <span class="tx-week-badge">${w.badge}</span>
                        <span class="tx-week-dates">${w.range}</span>
                    </div>
                    <svg viewBox="0 0 24 24" class="tx-week-chevron"><path d="M7 10l5 5 5-5z"/></svg>
                </div>
                <div class="tx-week-totals-row">
                    ${totalDisp}
                </div>
            `;

            sep.addEventListener('click', (e) => {
                e.preventDefault();
                toggleWeekCollapsed(w.key, sep);
            });

            listEl.appendChild(sep);

            currentWeekItemsEl = document.createElement('div');
            currentWeekItemsEl.className = 'tx-week-items' + (isCollapsed ? ' is-collapsed' : '');
            currentWeekItemsEl.id = `weekItems_${w.key}`;
            listEl.appendChild(currentWeekItemsEl);
        }

        const isTransfer = tx.type === 'transfer';
        const isExp = tx.type === 'expense';
        const isSuspended = isTxSuspended(tx);
        const cat = isExp ? appData.categories.find(c => c.id === tx.categoryId) : null;
        const mc = getTransactionMerchantAndComment(tx);

        let icon = '🏷️';
        let mainTitle = '';
        let sign = '';
        let colorClass = '';

        if (isTransfer) {
            icon = '🔄';
            const dir = tx.transferDirection || 'card-to-cash';
            const dirLabel = dir === 'card-to-cash' ? 'Card ➔ Cash (ATM)' : 'Cash ➔ Card (Depunere)';
            mainTitle = `Transfer ${dirLabel}`;
            sign = '⇄ ';
            colorClass = 'transfer-color';
        } else if (isExp) {
            icon = cat ? cat.icon : '🏷️';
            mainTitle = cat ? cat.name : 'Cheltuială';
            sign = '-';
            colorClass = 'expense-color';
        } else {
            icon = '💰';
            mainTitle = 'Venit';
            sign = '+';
            colorClass = 'income-color';
        }

        const amtRon = parseFloat(tx.amountInRon) || parseFloat(tx.amount) || 0;
        const mainAmount = convertFromRon(amtRon, mainCurr);
        const mainText = `${sign}${formatMoney(mainAmount, mainCurr)}`;
        const amountBlockHtml = isTransfer ? `
            <div class="tx-val-block">
                <span class="tx-val ${colorClass}">${mainText}</span>
            </div>
        ` : formatTransactionAmountHtml(tx, mainCurr, isExp);
        const suspendedBadgeHtml = isSuspended ? `<span class="tx-suspended-badge">⏸️ Suspendat</span>` : '';

        let payBadgeHtml = '';
        if (isTransfer) {
            const dir = tx.transferDirection || 'card-to-cash';
            payBadgeHtml = dir === 'card-to-cash'
                ? `<span class="tx-pay-badge transfer">💳 ➔ 💵 ATM</span>`
                : `<span class="tx-pay-badge transfer">💵 ➔ 💳 Depunere</span>`;
        } else {
            const payMethod = (tx.paymentMethod === 'cash') ? 'cash' : 'card';
            payBadgeHtml = payMethod === 'cash'
                ? `<span class="tx-pay-badge cash">💵 Cash</span>`
                : `<span class="tx-pay-badge card">💳 Card</span>`;
        }

        // Rândul 3: Comentariu / Descriere produs (dacă există)
        const commentText = (isExp ? mc.comment : (tx.description || '')).trim();
        const commentRowHtml = commentText ? `
            <div class="tx-row-comment">
                <span class="tx-comment-icon">💬</span>
                <span class="tx-comment-text">${escapeHtml(commentText)}</span>
            </div>
        ` : '';

        // Rândul 4 stânga: Magazinul (dacă există)
        let merchantBadgeHtml = '';
        if (isExp && mc.merchant) {
            merchantBadgeHtml = `<span class="tx-store-badge">${getMerchantLogoHtml(mc.merchant, 14)} <span>${escapeHtml(mc.merchant)}</span></span>`;
        } else if (isTransfer) {
            merchantBadgeHtml = `<span class="tx-cat-badge" style="color:var(--accent);">Transfer Intern</span>`;
        }

        const suspendIconSvg = isSuspended
            ? `<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M8 5v14l11-7z"/></svg>`
            : `<svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        const suspendTitle = isSuspended ? 'Reactivează tranzacția' : 'Suspendă tranzacția';
        const suspendBtnClass = 'tx-suspend-btn' + (isSuspended ? ' active' : '');

        const timeStr = getTransactionTimeDisplay(tx);
        const timeDisp = timeStr ? ` • ⏰ ${timeStr}` : '';

        const item = document.createElement('div');
        item.className = 'tx-item' + (isSuspended ? ' tx-suspended' : '');
        item.innerHTML = `
            <div class="tx-row-top">
                <div class="tx-desc-wrap">
                    <span class="tx-icon">${icon}</span>
                    <span class="tx-main-title" ${cat ? `style="color:${cat.color};"` : ''}>${escapeHtml(mainTitle)}</span>
                    ${suspendedBadgeHtml}
                </div>
                <div class="tx-amount-wrap">
                    ${amountBlockHtml}
                </div>
            </div>
            <div class="tx-row-middle">
                <span class="tx-date">📅 ${formatDateDisplay(tx.date)}${timeDisp}</span>
                ${payBadgeHtml}
            </div>
            ${commentRowHtml}
            <div class="tx-row-bottom">
                <div class="tx-merchant-wrap">
                    ${merchantBadgeHtml}
                </div>
                <div class="tx-buttons-wrap">
                    <button class="${suspendBtnClass}" title="${suspendTitle}" data-txid="${tx.id}">
                        ${suspendIconSvg}
                    </button>
                    <button class="tx-edit-btn" title="Modifică" data-txid="${tx.id}">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button class="tx-del-btn" title="Șterge" data-txid="${tx.id}">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `;

        item.querySelector('.tx-suspend-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSuspendTransaction(tx.id);
        });

        item.querySelector('.tx-edit-btn').addEventListener('click', () => {
            if (tx.type === 'transfer') {
                openEditTransferModal(tx);
            } else if (tx.type === 'expense') {
                openEditExpenseModal(tx);
            } else {
                openEditIncomeModal(tx);
            }
        });

        item.querySelector('.tx-del-btn').addEventListener('click', () => {
            if (confirm('Sigur doriți să ștergeți această tranzacție?')) {
                deleteTransaction(tx.id);
            }
        });

        if (currentWeekItemsEl) {
            currentWeekItemsEl.appendChild(item);
        } else {
            listEl.appendChild(item);
        }
    });
}

function toggleWeekCollapsed(weekKey, sepEl) {
    if (!appData.settings) appData.settings = {};
    if (!Array.isArray(appData.settings.collapsedWeeks)) {
        appData.settings.collapsedWeeks = [];
    }
    const idx = appData.settings.collapsedWeeks.indexOf(weekKey);
    const willCollapse = (idx < 0);
    if (willCollapse) {
        appData.settings.collapsedWeeks.push(weekKey);
    } else {
        appData.settings.collapsedWeeks.splice(idx, 1);
    }
    saveData();

    if (sepEl) {
        if (willCollapse) {
            sepEl.classList.add('is-collapsed');
            sepEl.setAttribute('title', 'Apasă pentru a deschide săptămâna');
        } else {
            sepEl.classList.remove('is-collapsed');
            sepEl.setAttribute('title', 'Apasă pentru a ascunde tranzacțiile săptămânii');
        }
    }
    const itemsEl = document.getElementById(`weekItems_${weekKey}`);
    if (itemsEl) {
        if (willCollapse) {
            itemsEl.classList.add('is-collapsed');
        } else {
            itemsEl.classList.remove('is-collapsed');
        }
    }
}

function updateSuspendedTxBadge() {
    const badge = document.getElementById('suspendedTxCountBadge');
    const btn = document.getElementById('btnOpenSuspendedTx');
    if (!badge || !appData || !Array.isArray(appData.transactions)) return;
    const suspendedCount = appData.transactions.filter(t => isTxSuspended(t)).length;
    badge.textContent = String(suspendedCount);
    if (btn) {
        btn.classList.toggle('has-suspended', suspendedCount > 0);
        btn.title = `Tranzacții suspendate: ${suspendedCount} (apasă pentru a le vizualiza)`;
    }
}

function renderSuspendedTransactionsList() {
    const listEl = document.getElementById('suspendedTransactionsList');
    const countEl = document.getElementById('modalSuspendedHeaderCount');
    if (!listEl) return;

    const suspendedList = appData.transactions.filter(t => isTxSuspended(t));
    suspendedList.sort((a, b) => new Date(b.date) - new Date(a.date) || (b.createdAt || 0) - (a.createdAt || 0));

    if (countEl) {
        countEl.textContent = String(suspendedList.length);
    }

    listEl.innerHTML = '';

    if (suspendedList.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="padding: 24px 10px; text-align: center; color: var(--text-muted);"><span>✨ Nu există nicio tranzacție suspendată.</span></div>`;
        return;
    }

    const mainCurr = getActiveCurrency();

    suspendedList.forEach(tx => {
        const isTransfer = tx.type === 'transfer';
        const isExp = tx.type === 'expense';
        const cat = isExp ? appData.categories.find(c => c.id === tx.categoryId) : null;
        const mc = getTransactionMerchantAndComment(tx);

        let icon = '🏷️';
        let mainTitle = '';

        if (isTransfer) {
            icon = '🔄';
            const dir = tx.transferDirection || 'card-to-cash';
            const dirLabel = dir === 'card-to-cash' ? 'Card ➔ Cash (ATM)' : 'Cash ➔ Card (Depunere)';
            mainTitle = `Transfer ${dirLabel}`;
        } else if (isExp) {
            icon = cat ? cat.icon : '🏷️';
            mainTitle = cat ? cat.name : 'Cheltuială';
        } else {
            icon = '💰';
            mainTitle = 'Venit';
        }

        const amountBlockHtml = formatTransactionAmountHtml(tx, mainCurr, isExp);

        let payBadgeHtml = '';
        if (isTransfer) {
            const dir = tx.transferDirection || 'card-to-cash';
            payBadgeHtml = dir === 'card-to-cash'
                ? `<span class="tx-pay-badge transfer">💳 ➔ 💵 ATM</span>`
                : `<span class="tx-pay-badge transfer">💵 ➔ 💳 Depunere</span>`;
        } else {
            const payMethod = (tx.paymentMethod === 'cash') ? 'cash' : 'card';
            payBadgeHtml = payMethod === 'cash'
                ? `<span class="tx-pay-badge cash">💵 Cash</span>`
                : `<span class="tx-pay-badge card">💳 Card</span>`;
        }

        const commentText = (isExp ? mc.comment : (tx.description || '')).trim();
        const commentRowHtml = commentText ? `
            <div class="tx-row-comment">
                <span class="tx-comment-icon">💬</span>
                <span class="tx-comment-text">${escapeHtml(commentText)}</span>
            </div>
        ` : '';

        let merchantBadgeHtml = '';
        if (isExp && mc.merchant) {
            merchantBadgeHtml = `<span class="tx-store-badge">${getMerchantLogoHtml(mc.merchant, 14)} <span>${escapeHtml(mc.merchant)}</span></span>`;
        } else if (isTransfer) {
            merchantBadgeHtml = `<span class="tx-cat-badge" style="color:var(--accent);">Transfer Intern</span>`;
        }

        const timeStr = getTransactionTimeDisplay(tx);
        const timeDisp = timeStr ? ` • ⏰ ${timeStr}` : '';

        const item = document.createElement('div');
        item.className = 'tx-item tx-suspended';
        item.innerHTML = `
            <div class="tx-row-top">
                <div class="tx-desc-wrap">
                    <span class="tx-icon">${icon}</span>
                    <span class="tx-main-title" ${cat ? `style="color:${cat.color};"` : ''}>${escapeHtml(mainTitle)}</span>
                    <span class="tx-suspended-badge">⏸️ Suspendat</span>
                </div>
                <div class="tx-amount-wrap">
                    ${amountBlockHtml}
                </div>
            </div>
            <div class="tx-row-middle">
                <span class="tx-date">📅 ${formatDateDisplay(tx.date)}${timeDisp}</span>
                ${payBadgeHtml}
            </div>
            ${commentRowHtml}
            <div class="tx-row-bottom">
                <div class="tx-merchant-wrap">
                    ${merchantBadgeHtml}
                </div>
                <div class="tx-buttons-wrap">
                    <button class="tx-suspend-btn active" title="Reactivează tranzacția" data-txid="${tx.id}">
                        <svg viewBox="0 0 24 24" style="width:15px;height:15px;fill:currentColor;"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <button class="tx-edit-btn" title="Modifică" data-txid="${tx.id}">
                        <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button class="tx-del-btn" title="Șterge" data-txid="${tx.id}">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `;

        item.querySelector('.tx-suspend-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSuspendTransaction(tx.id);
        });

        item.querySelector('.tx-edit-btn').addEventListener('click', () => {
            closeModal('modalSuspendedTransactions');
            if (tx.type === 'expense') {
                openEditExpenseModal(tx);
            } else {
                openEditIncomeModal(tx);
            }
        });

        item.querySelector('.tx-del-btn').addEventListener('click', () => {
            if (confirm('Sigur doriți să ștergeți această tranzacție?')) {
                deleteTransaction(tx.id);
            }
        });

        listEl.appendChild(item);
    });
}

function openSuspendedTransactionsModal() {
    renderSuspendedTransactionsList();
    openModal('modalSuspendedTransactions');
}

function toggleSuspendTransaction(txId) {
    const tx = appData.transactions.find(t => t.id === txId);
    if (!tx) return;
    tx.isSuspended = !isTxSuspended(tx);
    saveData();
    updateBalanceCards();
    renderOverviewChartAndList();
    renderTransactionsHistory();
    renderStatsTab();
    renderCurrencyConverter();
    updateSuspendedTxBadge();
    const modalSusp = document.getElementById('modalSuspendedTransactions');
    if (modalSusp && modalSusp.classList.contains('active')) {
        renderSuspendedTransactionsList();
    }
    showToast(tx.isSuspended ? '⏸️ Tranzacție suspendată (exclusă din calcule)' : '▶️ Tranzacție reactivată (inclusă în calcule)', 'info');
}

// ==========================================
// EXECUTIVE BUSINESS INTELLIGENCE STATS
// ==========================================
function getFilteredTransactionsForStats() {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const curMonthStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;

    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    const yearSelect = document.getElementById('statsYearSelect');
    const selectedYear = yearSelect && yearSelect.value ? parseInt(yearSelect.value, 10) : curYear;

    return appData.transactions.filter(t => {
        if (!t.date || isTxSuspended(t)) return false;
        if (currentStatsPeriod === 'month') {
            return t.date.startsWith(curMonthStr);
        } else if (currentStatsPeriod === '3months') {
            return t.date >= ninetyDaysAgoStr;
        } else if (currentStatsPeriod === 'year') {
            return t.date.startsWith(String(selectedYear));
        } else if (currentStatsPeriod === 'all') {
            return true;
        }
        return true;
    });
}

function getDaysInStatsPeriod() {
    const today = new Date();
    const curYear = today.getFullYear();

    if (currentStatsPeriod === 'month') {
        return Math.max(1, today.getDate());
    } else if (currentStatsPeriod === '3months') {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(today.getDate() - 90);
        const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

        const txsInWindow = appData.transactions.filter(t => !isTxSuspended(t) && t.date && t.date >= ninetyDaysAgoStr);
        if (txsInWindow.length === 0) return 90;

        const dates = txsInWindow.map(t => t.date).sort();
        const earliestDate = new Date(dates[0]);
        const diffFromEarliest = Math.ceil((today - earliestDate) / (1000 * 60 * 60 * 24));
        return Math.max(1, Math.min(90, diffFromEarliest));
    } else if (currentStatsPeriod === 'year') {
        const yearSelect = document.getElementById('statsYearSelect');
        const selectedYear = yearSelect && yearSelect.value ? parseInt(yearSelect.value, 10) : curYear;
        const yearPrefix = String(selectedYear);

        const txsInYear = appData.transactions.filter(t => !isTxSuspended(t) && t.date && t.date.startsWith(yearPrefix));
        if (txsInYear.length === 0) return 1;

        const dates = txsInYear.map(t => t.date).sort();
        const earliestDate = new Date(dates[0]);

        if (selectedYear === curYear) {
            // De la data primei tranzacții din anul curent până astăzi (fără diluare pe luni goale)
            const diffDays = Math.ceil((today - earliestDate) / (1000 * 60 * 60 * 24));
            return Math.max(1, Math.min(365, diffDays));
        } else {
            // An trecut selectat: de la prima până la ultima tranzacție din acel an
            const latestDate = new Date(dates[dates.length - 1]);
            const diffDays = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24));
            return Math.max(1, Math.min(365, diffDays));
        }
    } else {
        // Tot (All Time): diferența reală între prima și ultima tranzacție
        const validTxs = appData.transactions.filter(t => !isTxSuspended(t) && t.date);
        if (validTxs.length === 0) return 30;
        const dates = validTxs.map(t => t.date).sort();
        const d1 = new Date(dates[0]);
        const d2 = new Date(dates[dates.length - 1]);
        const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
    }
}

function formatKpiMoneyHtml(amount, currency, suffix = '') {
    const info = getCurrencyInfo(currency);
    const num = Math.abs(parseFloat(amount) || 0);
    const isNegative = parseFloat(amount) < 0;
    const formattedNum = num.toLocaleString('ro-RO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const prefix = isNegative ? '-' : '';
    const sym = info.symbol || currency;
    return `${prefix}${formattedNum}<span class="b-kpi-curr">${sym}${suffix}</span>`;
}

function renderStatsTab() {
    // Populate Year selector
    const yearSelect = document.getElementById('statsYearSelect');
    const curYear = new Date().getFullYear();
    const yearsSet = new Set([curYear]);

    appData.transactions.forEach(t => {
        if (t.date) {
            const y = parseInt(t.date.split('-')[0], 10);
            if (y) yearsSet.add(y);
        }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);
    const prevSelected = yearSelect.value ? parseInt(yearSelect.value, 10) : curYear;

    yearSelect.innerHTML = '';
    years.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = `${t('year_prefix')} ${y}`;
        if (y === prevSelected) opt.selected = true;
        yearSelect.appendChild(opt);
    });

    const wrapYear = document.getElementById('wrapStatsYearSelect');
    if (wrapYear) {
        wrapYear.style.display = currentStatsPeriod === 'year' ? 'block' : 'none';
    }

    // 1. Filtrăm tranzacțiile pentru perioada activă
    const filteredTxs = getFilteredTransactionsForStats();

    let totIncomeRon = 0;
    let totExpenseRon = 0;
    let peakExpenseTx = null;
    let peakIncomeTx = null;
    let expenseCount = 0;
    let incomeCount = 0;

    filteredTxs.forEach(t => {
        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        if (t.type === 'income') {
            totIncomeRon += amtRon;
            incomeCount++;
            if (!peakIncomeTx || amtRon > (parseFloat(peakIncomeTx.amountInRon) || parseFloat(peakIncomeTx.amount) || 0)) {
                peakIncomeTx = t;
            }
        } else if (t.type === 'expense') {
            totExpenseRon += amtRon;
            expenseCount++;
            if (!peakExpenseTx || amtRon > (parseFloat(peakExpenseTx.amountInRon) || parseFloat(peakExpenseTx.amount) || 0)) {
                peakExpenseTx = t;
            }
        }
    });

    const mainCurr = getActiveCurrency();
    const activeLang = getLanguageForCurrency();
    const curSymbol = getCurrencyInfo(mainCurr).symbol;
    const dayUnit = activeLang === 'ro' ? '/zi' : (activeLang === 'de' ? '/Tag' : (activeLang === 'tr' ? '/gün' : '/day'));

    const netSavingsRon = totIncomeRon - totExpenseRon;
    const savingsRate = totIncomeRon > 0 ? ((netSavingsRon / totIncomeRon) * 100).toFixed(1) : (netSavingsRon >= 0 ? '0.0' : '-');

    const daysCount = getDaysInStatsPeriod();
    const dailyAvgRon = totExpenseRon / Math.max(1, daysCount);
    const dailyIncomeRon = totIncomeRon / Math.max(1, daysCount);
    const avgTicketRon = expenseCount > 0 ? (totExpenseRon / expenseCount) : 0;

    // Calcul Sold Curent Total pentru Autonomie Financiară (Runway)
    let totalBalRon = 0;
    appData.transactions.forEach(t => {
        if (isTxSuspended(t)) return;
        const a = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        if (t.type === 'income') totalBalRon += a;
        else if (t.type === 'expense') totalBalRon -= a;
    });

    // 2. Afișare KPI-uri cu monedă stilizată mai mică
    const kpiIncEl = document.getElementById('statKpiIncome');
    if (kpiIncEl) kpiIncEl.innerHTML = formatKpiMoneyHtml(convertFromRon(totIncomeRon, mainCurr), mainCurr);

    const kpiExpEl = document.getElementById('statKpiExpense');
    if (kpiExpEl) kpiExpEl.innerHTML = formatKpiMoneyHtml(convertFromRon(totExpenseRon, mainCurr), mainCurr);

    const kpiSavEl = document.getElementById('statKpiSavings');
    if (kpiSavEl) {
        const savDisp = convertFromRon(netSavingsRon, mainCurr);
        kpiSavEl.innerHTML = formatKpiMoneyHtml(savDisp, mainCurr);
        kpiSavEl.className = 'b-kpi-value ' + (netSavingsRon >= 0 ? 'income-color' : 'expense-color');
    }

    const kpiRateEl = document.getElementById('statKpiRate');
    if (kpiRateEl) {
        kpiRateEl.textContent = savingsRate + (savingsRate !== '-' ? '%' : '');
        kpiRateEl.className = 'b-kpi-value ' + (parseFloat(savingsRate) >= 20 ? 'income-color' : (parseFloat(savingsRate) > 0 ? '' : 'expense-color'));
    }

    const kpiRateFill = document.getElementById('statKpiRateFill');
    if (kpiRateFill) {
        const ratePct = Math.max(0, Math.min(100, parseFloat(savingsRate) || 0));
        kpiRateFill.style.width = ratePct + '%';
        kpiRateFill.style.background = ratePct >= 20 ? 'linear-gradient(90deg, #10b981, #059669)' : (ratePct > 5 ? 'linear-gradient(90deg, #3b82f6, #2563eb)' : 'linear-gradient(90deg, #f59e0b, #ef4444)');
    }

    const kpiAvgEl = document.getElementById('statKpiDailyAvg');
    if (kpiAvgEl) {
        const avgDisp = convertFromRon(dailyAvgRon, mainCurr);
        kpiAvgEl.innerHTML = formatKpiMoneyHtml(avgDisp, mainCurr, dayUnit);
    }

    const kpiPeakVal = document.getElementById('statKpiPeakVal');
    const kpiPeakDesc = document.getElementById('statKpiPeakDesc');
    if (kpiPeakVal && kpiPeakDesc) {
        if (peakExpenseTx) {
            const pAmt = parseFloat(peakExpenseTx.amountInRon) || parseFloat(peakExpenseTx.amount) || 0;
            kpiPeakVal.innerHTML = formatKpiMoneyHtml(convertFromRon(pAmt, mainCurr), mainCurr);
            const pCat = appData.categories.find(c => c.id === peakExpenseTx.categoryId) || { name: 'Cheltuială', icon: '⚡' };
            const pDate = formatDateDisplay(peakExpenseTx.date);
            kpiPeakDesc.textContent = `${pCat.icon} ${pCat.name} • ${pDate}`;
        } else {
            kpiPeakVal.innerHTML = `0<span class="b-kpi-curr">${curSymbol}</span>`;
            kpiPeakDesc.textContent = '-';
        }
    }

    // 7. Medie Venit/zi
    const kpiDailyIncomeEl = document.getElementById('statKpiDailyIncome');
    if (kpiDailyIncomeEl) {
        const dIncDisp = convertFromRon(dailyIncomeRon, mainCurr);
        kpiDailyIncomeEl.innerHTML = formatKpiMoneyHtml(dIncDisp, mainCurr, dayUnit);
    }

    // 8. Vârf Încasare
    const kpiPeakIncVal = document.getElementById('statKpiPeakIncomeVal');
    const kpiPeakIncDesc = document.getElementById('statKpiPeakIncomeDesc');
    if (kpiPeakIncVal && kpiPeakIncDesc) {
        if (peakIncomeTx) {
            const pAmt = parseFloat(peakIncomeTx.amountInRon) || parseFloat(peakIncomeTx.amount) || 0;
            kpiPeakIncVal.innerHTML = formatKpiMoneyHtml(convertFromRon(pAmt, mainCurr), mainCurr);
            const desc = peakIncomeTx.description || t('total_income');
            const pDate = formatDateDisplay(peakIncomeTx.date);
            kpiPeakIncDesc.textContent = `💼 ${desc} • ${pDate}`;
        } else {
            kpiPeakIncVal.innerHTML = `0<span class="b-kpi-curr">${curSymbol}</span>`;
            kpiPeakIncDesc.textContent = '-';
        }
    }

    // 9. Coș Mediu Bon
    const kpiAvgTicketEl = document.getElementById('statKpiAvgTicket');
    const kpiAvgTicketSub = document.getElementById('statKpiAvgTicketSub');
    if (kpiAvgTicketEl) {
        const ticketDisp = convertFromRon(avgTicketRon, mainCurr);
        const ticketSuffix = activeLang === 'ro' ? '/bon' : (activeLang === 'de' ? '/Bon' : (activeLang === 'tr' ? '/fiş' : '/tx'));
        kpiAvgTicketEl.innerHTML = formatKpiMoneyHtml(ticketDisp, mainCurr, ticketSuffix);
    }
    if (kpiAvgTicketSub) {
        kpiAvgTicketSub.textContent = `${expenseCount} ${activeLang === 'ro' ? 'plăți înregistrate' : 'payments'}`;
    }

    // 10. Autonomie Financiară (Runway) - Unificată cu Scutul din Antet (Ritm Real Recent)
    const kpiRunwayEl = document.getElementById('statKpiRunway');
    const kpiRunwaySub = document.getElementById('statKpiRunwaySub');
    if (kpiRunwayEl && kpiRunwaySub) {
        const daysRunway = calculateGlobalRunwayDays();

        if (totalBalRon <= 0) {
            kpiRunwayEl.innerHTML = `0 <span class="b-kpi-curr">${activeLang === 'ro' ? 'Zile' : 'Days'}</span>`;
            kpiRunwaySub.textContent = activeLang === 'ro' ? 'Sold epuizat' : 'Zero reserves';
        } else if (daysRunway >= 999) {
            kpiRunwayEl.innerHTML = `&infin; <span class="b-kpi-curr">${activeLang === 'ro' ? 'Zile' : 'Days'}</span>`;
            kpiRunwaySub.textContent = activeLang === 'ro' ? 'Fără cheltuieli' : 'No expenses';
        } else if (daysRunway >= 60) {
            const moRunway = (daysRunway / 30.4).toFixed(1);
            kpiRunwayEl.innerHTML = `~${moRunway} <span class="b-kpi-curr">${activeLang === 'ro' ? 'Luni' : 'Mo'}</span>`;
            kpiRunwaySub.textContent = `~${daysRunway} ${activeLang === 'ro' ? 'zile de rezervă' : 'reserve days'}`;
        } else {
            kpiRunwayEl.innerHTML = `${daysRunway} <span class="b-kpi-curr">${activeLang === 'ro' ? 'Zile' : 'Days'}</span>`;
            kpiRunwaySub.textContent = activeLang === 'ro' ? 'La ritmul curent' : 'At current rate';
        }
    }

    // 11. Volum & Activitate Tranzacții
    const kpiTxCountEl = document.getElementById('statKpiTotalTxCount');
    const kpiActivitySub = document.getElementById('statKpiActivitySub');
    if (kpiTxCountEl) {
        const totTx = expenseCount + incomeCount;
        kpiTxCountEl.innerHTML = `${totTx} <span class="b-kpi-curr">${activeLang === 'ro' ? 'tranzacții' : 'transactions'}</span>`;
    }
    if (kpiActivitySub) {
        kpiActivitySub.textContent = `${expenseCount} ${activeLang === 'ro' ? 'plăți' : 'expenses'} • ${incomeCount} ${activeLang === 'ro' ? 'încasări' : 'income'}`;
    }

    // 12. Facturi & Utilități (Calcul Card KPI)
    let totBillsRon = 0;
    let billsCount = 0;
    filteredTxs.filter(t => t.type === 'expense').forEach(t => {
        if (isBillTransaction(t)) {
            const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
            totBillsRon += amtRon;
            billsCount++;
        }
    });
    const kpiBillsEl = document.getElementById('statKpiBillsTotal');
    const kpiBillsSub = document.getElementById('statKpiBillsSub');
    if (kpiBillsEl) {
        kpiBillsEl.innerHTML = formatKpiMoneyHtml(convertFromRon(totBillsRon, mainCurr), mainCurr);
    }
    if (kpiBillsSub) {
        const billsPct = totExpenseRon > 0 ? ((totBillsRon / totExpenseRon) * 100).toFixed(1) : '0';
        kpiBillsSub.textContent = `${billsCount} ${activeLang === 'ro' ? 'facturi' : 'bills'} • ${billsPct}% ${activeLang === 'ro' ? 'din cheltuieli' : 'of spend'}`;
    }

    // 3. GRAFIC 1: Distribuție pe Zilele Săptămânii (plasat deasupra Cashflow)
    renderStatsWeekdayChart(filteredTxs, mainCurr, curSymbol, activeLang);

    // 4. GRAFIC 2: Distribuție pe Interval Orar
    renderStatsHourlyChart(filteredTxs, mainCurr, curSymbol, activeLang);

    // 5. GRAFIC 3: Distribuție pe Zilele Lunii (1 - 31)
    renderStatsMonthDaysChart(filteredTxs, mainCurr, curSymbol, activeLang);

    // 6. GRAFIC 4: Evoluție Cashflow (Venituri vs Cheltuieli)
    renderStatsCashflowChart(mainCurr, activeLang, curSymbol);

    // 7. GRAFIC 5: Clasament Categorii (Bare Progresive)
    renderStatsTopCategories(filteredTxs, mainCurr, totExpenseRon);

    // 8. TABEL 6: Raport Sintetic P&L
    renderStatsPlTable(mainCurr, activeLang);
}

// Grafic 1: Cashflow (Venituri vs Cheltuieli)
function renderStatsCashflowChart(mainCurr, activeLang, curSymbol) {
    const yearSelect = document.getElementById('statsYearSelect');
    const curYear = new Date().getFullYear();
    const activeYear = yearSelect && yearSelect.value ? parseInt(yearSelect.value, 10) : curYear;

    const monthsIncomeRon = new Array(12).fill(0);
    const monthsExpenseRon = new Array(12).fill(0);

    appData.transactions.forEach(t => {
        if (!t.date) return;
        const [y, m] = t.date.split('-').map(Number);
        if (y === activeYear) {
            const mIndex = m - 1;
            const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
            if (t.type === 'income') monthsIncomeRon[mIndex] += amtRon;
            else if (t.type === 'expense') monthsExpenseRon[mIndex] += amtRon;
        }
    });

    const monthsIncomeDisp = monthsIncomeRon.map(v => convertFromRon(v, mainCurr));
    const monthsExpenseDisp = monthsExpenseRon.map(v => convertFromRon(v, mainCurr));

    const monthLabels = I18N_DICTIONARY[activeLang]?.monthsShort || I18N_DICTIONARY['ro'].monthsShort;
    const canvas = document.getElementById('statsMonthlyBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (monthlyBarChartInstance) {
        monthlyBarChartInstance.destroy();
    }

    monthlyBarChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: `${t('stat_income')} (${curSymbol})`,
                    data: monthsIncomeDisp,
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    barPercentage: 0.65,
                    categoryPercentage: 0.8
                },
                {
                    label: `${t('stat_expense')} (${curSymbol})`,
                    data: monthsExpenseDisp,
                    backgroundColor: '#ef4444',
                    borderRadius: 4,
                    barPercentage: 0.65,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'var(--text-muted)', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 10 },
                        callback: (v) => v + ' ' + curSymbol
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: document.body.classList.contains('light-theme') ? '#0f172a' : '#f8fafc',
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${formatMoney(ctx.raw, mainCurr)}`
                    }
                },
                datalabels: { display: false }
            }
        }
    });
}

// Grafic 2: Top Categorii de Cheltuieli (Bare Orizontale Progresive)
function renderStatsTopCategories(filteredTxs, mainCurr, totExpenseRon) {
    const listEl = document.getElementById('statsTopCategoriesList');
    const countEl = document.getElementById('statsTopCatCount');
    if (!listEl) return;
    listEl.innerHTML = '';

    const catSums = {};
    filteredTxs.filter(t => t.type === 'expense').forEach(t => {
        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        catSums[t.categoryId] = (catSums[t.categoryId] || 0) + amtRon;
    });

    const sortedCatIds = Object.keys(catSums).sort((a, b) => catSums[b] - catSums[a]);

    if (countEl) {
        countEl.textContent = sortedCatIds.length > 0 ? `${sortedCatIds.length} ${t('expenses_by_cat')}` : '';
    }

    if (sortedCatIds.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding: 20px 10px; color: var(--text-muted); font-size: 0.8rem;">Nu există cheltuieli înregistrate în această perioadă.</div>`;
        return;
    }

    const maxVal = catSums[sortedCatIds[0]] || 1;

    sortedCatIds.slice(0, 8).forEach(catId => {
        const cat = appData.categories.find(c => c.id === catId) || { name: 'Altele', icon: '🏷️', color: '#64748b' };
        const sumRon = catSums[catId];
        const sumDisp = convertFromRon(sumRon, mainCurr);
        const pct = totExpenseRon > 0 ? ((sumRon / totExpenseRon) * 100).toFixed(1) : 0;
        const relativeBarPct = Math.min(100, Math.max(6, (sumRon / maxVal) * 100));

        const row = document.createElement('div');
        row.className = 'top-cat-row';
        row.innerHTML = `
            <div class="top-cat-meta">
                <div class="top-cat-name-box">
                    <span style="font-size: 1.1rem; line-height: 1;">${cat.icon || '🏷️'}</span>
                    <span>${escapeHtml(cat.name)}</span>
                </div>
                <div class="top-cat-val-box">
                    <span class="top-cat-sum">${formatKpiMoneyHtml(sumDisp, mainCurr)}</span>
                    <span class="top-cat-pct">${pct}%</span>
                </div>
            </div>
            <div class="top-cat-bar-bg">
                <div class="top-cat-bar-fill" style="width: ${relativeBarPct}%; background-color: ${cat.color || 'var(--accent)'};"></div>
            </div>
        `;
        listEl.appendChild(row);
    });
}

// Grafic 3: Distributie Cheltuieli pe Zilele Saptamanii (Luni - Duminica)
function renderStatsWeekdayChart(filteredTxs, mainCurr, curSymbol, activeLang) {
    const canvas = document.getElementById('statsWeekdayChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const daySumsRon = [0, 0, 0, 0, 0, 0, 0]; // 0=Lun, 1=Mar, 2=Mie, 3=Joi, 4=Vin, 5=Sam, 6=Dum

    filteredTxs.filter(t => t.type === 'expense').forEach(t => {
        if (!t.date) return;
        const d = new Date(t.date + 'T12:00:00');
        const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const mappedIdx = (day + 6) % 7; // 0=Mon, ..., 6=Sun
        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        daySumsRon[mappedIdx] += amtRon;
    });

    const daySumsDisp = daySumsRon.map(v => convertFromRon(v, mainCurr));

    const dayLabelsMap = {
        ro: ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'],
        en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
        ja: ['月', '火', '水', '木', '金', '土', '日'],
        zh: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    };
    const dayLabels = dayLabelsMap[activeLang] || dayLabelsMap['ro'];

    if (statsWeekdayChartInstance) {
        statsWeekdayChartInstance.destroy();
    }
    statsWeekdayChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayLabels,
            datasets: [{
                label: `${t('stat_expense')} (${curSymbol})`,
                data: daySumsDisp,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                hoverBackgroundColor: '#3b82f6',
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'var(--text-muted)', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 10 },
                        callback: (v) => v + ' ' + curSymbol
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${formatMoney(ctx.raw, mainCurr)}`
                    }
                },
                datalabels: { display: false }
            }
        }
    });
}

// Calcul Sold Curent Total pentru Autonomie Financiară (Runway)
function calculateTotalBalance() {
    let totalBalRon = 0;
    appData.transactions.forEach(t => {
        if (isTxSuspended(t)) return;
        const a = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        if (t.type === 'income') totalBalRon += a;
        else if (t.type === 'expense') totalBalRon -= a;
    });
    return totalBalRon;
}

// Functie auxiliara pentru extragerea orei tranzactiei (0 - 23)
function getTransactionHour(t) {
    if (t.time && typeof t.time === 'string' && t.time.includes(':')) {
        const h = parseInt(t.time.split(':')[0], 10);
        if (!isNaN(h) && h >= 0 && h <= 23) return h;
    }
    if (t.createdAt) {
        const d = new Date(t.createdAt);
        if (!isNaN(d.getTime())) return d.getHours();
    }
    if (t.id && typeof t.id === 'string' && t.id.startsWith('tx-')) {
        const parts = t.id.split('-');
        const ts = parseInt(parts[1], 10);
        if (!isNaN(ts) && ts > 1600000000000) {
            const d = new Date(ts);
            if (!isNaN(d.getTime())) return d.getHours();
        }
    }
    return null;
}

// Grafic 2: Distributie Cheltuieli pe Interval Orar (00:00 - 23:00)
function renderStatsHourlyChart(filteredTxs, mainCurr, curSymbol, activeLang) {
    const canvas = document.getElementById('statsHourlyChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const badgeEl = document.getElementById('statsPeakHourBadge');

    const hourlySumsRon = new Array(24).fill(0);
    const hourlyCounts = new Array(24).fill(0);

    filteredTxs.filter(t => t.type === 'expense' && !isTxSuspended(t)).forEach(t => {
        const h = getTransactionHour(t);
        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        if (h !== null && h >= 0 && h <= 23) {
            hourlySumsRon[h] += amtRon;
            hourlyCounts[h]++;
        }
    });

    // Identificare ora de varf
    let peakHour = -1;
    let peakSumRon = 0;
    for (let i = 0; i < 24; i++) {
        if (hourlySumsRon[i] > peakSumRon) {
            peakSumRon = hourlySumsRon[i];
            peakHour = i;
        }
    }

    if (badgeEl) {
        if (peakHour !== -1 && peakSumRon > 0) {
            const nextH = (peakHour + 1) % 24;
            const hStr = `${String(peakHour).padStart(2, '0')}:00–${String(nextH).padStart(2, '0')}:00`;
            const peakDisp = formatMoney(convertFromRon(peakSumRon, mainCurr), mainCurr);
            badgeEl.textContent = `⚡ Vârf: ${hStr} (${peakDisp})`;
            badgeEl.style.display = 'inline-block';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    const hourlySumsDisp = hourlySumsRon.map(v => convertFromRon(v, mainCurr));

    // Etichete de la 00h la 23h
    const hourLabels = [
        '00h', '01h', '02h', '03h', '04h', '05h', '06h', '07h', '08h', '09h', '10h', '11h',
        '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h', '23h'
    ];

    // Culori: evidentiere pe bara cu cea mai mare cheltuiala
    const bgColors = hourlySumsRon.map(val => (val > 0 && val === peakSumRon) ? '#f59e0b' : 'rgba(245, 158, 11, 0.55)');
    const hoverColors = hourlySumsRon.map(val => (val > 0 && val === peakSumRon) ? '#d97706' : '#f59e0b');

    if (statsHourlyChartInstance) {
        statsHourlyChartInstance.destroy();
    }

    statsHourlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [{
                label: `${t('stat_expense')} (${curSymbol})`,
                data: hourlySumsDisp,
                backgroundColor: bgColors,
                hoverBackgroundColor: hoverColors,
                borderRadius: 3,
                barPercentage: 0.75
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 9 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                },
                y: {
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 10 },
                        callback: (v) => v + ' ' + curSymbol
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const idx = items[0].dataIndex;
                            const nextH = (idx + 1) % 24;
                            return `Interval ${String(idx).padStart(2, '0')}:00 – ${String(nextH).padStart(2, '0')}:00`;
                        },
                        label: (ctx) => {
                            const count = hourlyCounts[ctx.dataIndex];
                            const countTxt = activeLang === 'ro' ? `${count} plăți` : `${count} tx`;
                            return ` ${formatMoney(ctx.raw, mainCurr)} (${countTxt})`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });
}

// Grafic 3: Distribuție Cheltuieli pe Zilele Lunii (1 - 31)
function renderStatsMonthDaysChart(filteredTxs, mainCurr, curSymbol, activeLang) {
    const canvas = document.getElementById('statsMonthDaysChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const badgeEl = document.getElementById('statsPeakMonthDayBadge');

    const monthDaySumsRon = new Array(31).fill(0);
    const monthDayCounts = new Array(31).fill(0);

    filteredTxs.filter(t => t.type === 'expense' && !isTxSuspended(t)).forEach(t => {
        if (!t.date || typeof t.date !== 'string') return;
        const parts = t.date.split('-');
        if (parts.length >= 3) {
            const dayNum = parseInt(parts[2], 10);
            if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                monthDaySumsRon[dayNum - 1] += amtRon;
                monthDayCounts[dayNum - 1]++;
            }
        }
    });

    // Identificare ziua de vârf a lunii
    let peakDayIdx = -1;
    let peakSumRon = 0;
    for (let i = 0; i < 31; i++) {
        if (monthDaySumsRon[i] > peakSumRon) {
            peakSumRon = monthDaySumsRon[i];
            peakDayIdx = i;
        }
    }

    if (badgeEl) {
        if (peakDayIdx !== -1 && peakSumRon > 0) {
            const dayStr = peakDayIdx + 1;
            const peakDisp = formatMoney(convertFromRon(peakSumRon, mainCurr), mainCurr);
            const peakLabel = activeLang === 'ro' ? `⚡ Vârf: Ziua ${dayStr} (${peakDisp})` :
                              activeLang === 'de' ? `⚡ Spitze: Tag ${dayStr} (${peakDisp})` :
                              activeLang === 'tr' ? `⚡ Zirve: Gün ${dayStr} (${peakDisp})` :
                              activeLang === 'zh' ? `⚡ 高峰: ${dayStr}日 (${peakDisp})` :
                              activeLang === 'ja' ? `⚡ ピーク: ${dayStr}日 (${peakDisp})` :
                              `⚡ Peak: Day ${dayStr} (${peakDisp})`;
            badgeEl.textContent = peakLabel;
            badgeEl.style.display = 'inline-block';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    const monthDaySumsDisp = monthDaySumsRon.map(v => convertFromRon(v, mainCurr));
    const dayLabels = Array.from({ length: 31 }, (_, i) => String(i + 1));

    // Culori: evidențiere elegantă pe ziua de vârf cu violet
    const bgColors = monthDaySumsRon.map(val => (val > 0 && val === peakSumRon) ? '#8b5cf6' : 'rgba(139, 92, 246, 0.55)');
    const hoverColors = monthDaySumsRon.map(val => (val > 0 && val === peakSumRon) ? '#7c3aed' : '#8b5cf6');

    if (statsMonthDaysChartInstance) {
        statsMonthDaysChartInstance.destroy();
    }

    statsMonthDaysChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayLabels,
            datasets: [{
                label: `${t('stat_expense')} (${curSymbol})`,
                data: monthDaySumsDisp,
                backgroundColor: bgColors,
                hoverBackgroundColor: hoverColors,
                borderRadius: 3,
                barPercentage: 0.75
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 9 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 16
                    }
                },
                y: {
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 10 },
                        callback: (v) => v + ' ' + curSymbol
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const dayNum = items[0].dataIndex + 1;
                            return activeLang === 'ro' ? `Ziua ${dayNum} a lunii` :
                                   activeLang === 'de' ? `Tag ${dayNum} des Monats` :
                                   activeLang === 'tr' ? `Ayın ${dayNum}. günü` :
                                   activeLang === 'zh' ? `${dayNum}日` :
                                   activeLang === 'ja' ? `${dayNum}日` :
                                   `Day ${dayNum} of month`;
                        },
                        label: (ctx) => {
                            const count = monthDayCounts[ctx.dataIndex];
                            const countTxt = activeLang === 'ro' ? `${count} plăți` :
                                             activeLang === 'de' ? `${count} Zahlungen` :
                                             activeLang === 'tr' ? `${count} işlem` :
                                             activeLang === 'zh' ? `${count}笔` :
                                             activeLang === 'ja' ? `${count}件` :
                                             `${count} payments`;
                            return ` ${formatMoney(ctx.raw, mainCurr)} (${countTxt})`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });
}

// Tabel 4: Situație Sintetică P&L
function renderStatsPlTable(mainCurr, activeLang) {
    const tbody = document.getElementById('statsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const monthAgg = {};
    appData.transactions.forEach(t => {
        if (!t.date || t.isSuspended) return;
        const ym = t.date.slice(0, 7);
        if (!monthAgg[ym]) {
            monthAgg[ym] = { incomeRon: 0, expenseRon: 0 };
        }
        const amt = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        if (t.type === 'income') monthAgg[ym].incomeRon += amt;
        else if (t.type === 'expense') monthAgg[ym].expenseRon += amt;
    });

    const months = Object.keys(monthAgg).sort().reverse();
    if (months.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted);">Nicio tranzacție salvată.</td></tr>`;
        return;
    }

    const monthNames = I18N_DICTIONARY[activeLang]?.months || I18N_DICTIONARY['ro'].months;

    months.slice(0, 12).forEach(ym => {
        const [yStr, mStr] = ym.split('-');
        const mNum = parseInt(mStr, 10);
        const monthLabel = `${monthNames[mNum - 1] || mStr} ${yStr}`;

        const incRon = monthAgg[ym].incomeRon;
        const expRon = monthAgg[ym].expenseRon;
        const netRon = incRon - expRon;
        const rate = incRon > 0 ? ((netRon / incRon) * 100).toFixed(0) : (netRon >= 0 ? '0' : '-');

        const incDisp = formatMoney(convertFromRon(incRon, mainCurr), mainCurr);
        const expDisp = formatMoney(convertFromRon(expRon, mainCurr), mainCurr);
        const netDisp = formatMoney(convertFromRon(netRon, mainCurr), mainCurr);
        const netClass = netRon >= 0 ? 'income-color' : 'expense-color';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700; color: var(--text-color);">${monthLabel}</td>
            <td style="text-align: right; font-weight: 600;" class="income-color">${incDisp}</td>
            <td style="text-align: right; font-weight: 600;" class="expense-color">${expDisp}</td>
            <td style="text-align: right; font-weight: 800;" class="${netClass}">${netDisp}</td>
            <td style="text-align: right; font-weight: 700;"><span class="stats-table-badge" style="background:${netRon >= 0 ? 'rgba(16,185,129,0.15); color:#10b981;' : 'rgba(239,68,68,0.15); color:#ef4444;'}">${rate}${rate !== '-' ? '%' : ''}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function exportStatsTableCsv() {
    const mainCurr = getActiveCurrency();
    const activeLang = getLanguageForCurrency();
    const monthNames = I18N_DICTIONARY[activeLang]?.months || I18N_DICTIONARY['ro'].months;

    const monthAgg = {};
    appData.transactions.forEach(t => {
        if (!t.date) return;
        const ym = t.date.slice(0, 7);
        if (!monthAgg[ym]) monthAgg[ym] = { incomeRon: 0, expenseRon: 0 };
        const amt = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        if (t.type === 'income') monthAgg[ym].incomeRon += amt;
        else if (t.type === 'expense') monthAgg[ym].expenseRon += amt;
    });

    const months = Object.keys(monthAgg).sort().reverse();
    let csv = `Perioada,Venituri (${mainCurr}),Cheltuieli (${mainCurr}),Sold Net (${mainCurr}),Rata Economisire (%)\r\n`;

    months.forEach(ym => {
        const [yStr, mStr] = ym.split('-');
        const mNum = parseInt(mStr, 10);
        const monthLabel = `"${monthNames[mNum - 1] || mStr} ${yStr}"`;
        const inc = convertFromRon(monthAgg[ym].incomeRon, mainCurr).toFixed(2);
        const exp = convertFromRon(monthAgg[ym].expenseRon, mainCurr).toFixed(2);
        const net = convertFromRon(monthAgg[ym].incomeRon - monthAgg[ym].expenseRon, mainCurr).toFixed(2);
        const rate = monthAgg[ym].incomeRon > 0 ? (((monthAgg[ym].incomeRon - monthAgg[ym].expenseRon) / monthAgg[ym].incomeRon) * 100).toFixed(1) : '0';
        csv += `${monthLabel},${inc},${exp},${net},${rate}%\r\n`;
    });

    const fileName = `MoneyApp_Raport_Financiar_${getTodayString()}.csv`;

    if (window.AndroidBridge && typeof window.AndroidBridge.shareFileNative === 'function') {
        window.AndroidBridge.shareFileNative(fileName, csv, 'text/csv');
        showToast(t('export_downloaded_toast'), 'success');
        return;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    showToast(t('export_downloaded_toast'), 'success');
}

// ==========================================
// BUSINESS INTELLIGENCE: ANALIZĂ COMPARATIVĂ COȘ MÂNCARE & MAGAZINE
// ==========================================
const KNOWN_MERCHANTS = [
    { key: 'lidl', name: 'Lidl', icon: '🟡', color: '#0050aa', match: ['lidl'] },
    { key: 'kaufland', name: 'Kaufland', icon: '🔴', color: '#e60000', match: ['kaufland'] },
    { key: 'carrefour', name: 'Carrefour', icon: '🛍️', color: '#004e9a', match: ['carrefour', 'carrefur'] },
    { key: 'mega_image', name: 'Mega Image', icon: '🦁', color: '#d8232a', match: ['mega image', 'mega'] },
    { key: 'profi', name: 'Profi', icon: '🏪', color: '#007ac1', match: ['profi'] },
    { key: 'penny', name: 'Penny', icon: '🧺', color: '#cc0000', match: ['penny'] },
    { key: 'auchan', name: 'Auchan', icon: '🏬', color: '#e2001a', match: ['auchan'] },
    { key: 'metro', name: 'Metro', icon: '🏢', color: '#002b49', match: ['metro'] },
    { key: 'selgros', name: 'Selgros', icon: '🏢', color: '#e30613', match: ['selgros'] },
    { key: 'freshful', name: 'Freshful', icon: '🥬', color: '#00b050', match: ['freshful'] },
    { key: 'sezamo', name: 'Sezamo', icon: '🥖', color: '#eab308', match: ['sezamo'] },
    { key: 'cora', name: 'Cora', icon: '🛒', color: '#0284c7', match: ['cora'] },
    { key: 'supeco', name: 'Supeco', icon: '🛒', color: '#ea580c', match: ['supeco'] },
    { key: 'diana', name: 'Diana', icon: '🥩', color: '#dc2626', match: ['diana'] },
    { key: 'unicarm', name: 'Unicarm', icon: '🥓', color: '#b91c1c', match: ['unicarm'] },
    { key: 'annabella', name: 'Annabella', icon: '🍎', color: '#ef4444', match: ['annabella'] },
    { key: 'sergiana', name: 'Sergiana', icon: '🥩', color: '#991b1b', match: ['sergiana'] },
    { key: 'ardealu', name: 'Ardealu', icon: '🥩', color: '#b91c1c', match: ['ardealu', 'ardealul', 'ardeal'] },
    { key: 'petresti', name: 'Petrești', icon: '🏪', color: '#d97706', match: ['petresti', 'petrești', 'piata petresti', 'piața petrești'] },
    { key: 'piata', name: 'Piață / Tarabă', icon: '🥦', color: '#16a34a', match: ['piata', 'piață', 'aprozar', 'taraba', 'tarabă', 'legume', 'fructe'] },
    { key: 'macelarie', name: 'Măcelărie', icon: '🥩', color: '#b91c1c', match: ['macelarie', 'măcelărie', 'carmangerie', 'mezeluri', 'carne'] },
    { key: 'brutarie', name: 'Brutărie / Panificație', icon: '🥖', color: '#d97706', match: ['brutarie', 'brutărie', 'panificatie', 'panificație', 'brutar'] },
    { key: 'cofetarie', name: 'Cofetărie / Patiserie', icon: '🍰', color: '#ec4899', match: ['cofetarie', 'cofetărie', 'patiserie', 'dulciuri', 'prajituri', 'torturi'] },
    { key: 'simigerie_luca', name: 'Simigeria LUCA', icon: '🥨', color: '#e11d48', match: ['luca', 'simigeria luca'] },
    { key: 'simigerie_matei', name: 'Simigeria Matei', icon: '🥨', color: '#ea580c', match: ['matei', 'simigeria matei'] },
    { key: 'simigerie_petru', name: 'Simigeria Petru', icon: '🥨', color: '#d97706', match: ['petru', 'simigeria petru'] },
    { key: 'fornetti', name: 'Fornetti', icon: '🥐', color: '#ca8a04', match: ['fornetti', 'forneti'] },
    
    // Tech / Subscripții / Servicii
    { key: 'google', name: 'Google', icon: '🌐', color: '#4285f4', match: ['google', 'play store', 'google play', 'youtube', 'gsuite', 'google one', 'google drive'] },
    { key: 'apple', name: 'Apple', icon: '🍎', color: '#8e8e93', match: ['apple', 'app store', 'itunes', 'icloud'] },
    { key: 'microsoft', name: 'Microsoft', icon: '💻', color: '#00a4ef', match: ['microsoft', 'office 365', 'xbox', 'windows'] },
    { key: 'emag', name: 'eMAG', icon: '📦', color: '#005ebd', match: ['emag', 'genius', 'sameday'] },
    { key: 'altex', name: 'Altex', icon: '⚡', color: '#ffd100', match: ['altex', 'alt ex'] },
    { key: 'flanco', name: 'Flanco', icon: '🔌', color: '#ff6600', match: ['flanco'] },
    { key: 'pcgarage', name: 'PC Garage', icon: '🖥️', color: '#c20e1a', match: ['pc garage', 'pcgarage'] },
    { key: 'amazon', name: 'Amazon', icon: '📦', color: '#ff9900', match: ['amazon', 'aws', 'prime'] },
    { key: 'netflix', name: 'Netflix', icon: '🎬', color: '#e50914', match: ['netflix'] },
    { key: 'spotify', name: 'Spotify', icon: '🎵', color: '#1db954', match: ['spotify'] },
    { key: 'hbo', name: 'Max / HBO', icon: '📺', color: '#9333ea', match: ['hbo', 'max', 'hbomax'] },
    { key: 'disney', name: 'Disney+', icon: '✨', color: '#113ccf', match: ['disney', 'disney+'] },
    { key: 'openai', name: 'OpenAI / ChatGPT', icon: '🤖', color: '#10a37f', match: ['openai', 'chatgpt'] },
    { key: 'steam', name: 'Steam / Gaming', icon: '🎮', color: '#171a21', match: ['steam', 'playstation', 'psn', 'xbox', 'nintendo'] },

    // Utilități / Telecom
    { key: 'digi', name: 'Digi / RCS-RDS', icon: '📶', color: '#005baa', match: ['digi', 'rcs', 'rds', 'rcs rds'] },
    { key: 'orange', name: 'Orange', icon: '🍊', color: '#ff6600', match: ['orange', 'yoxo'] },
    { key: 'vodafone', name: 'Vodafone', icon: '🔴', color: '#e60000', match: ['vodafone'] },
    { key: 'telekom', name: 'Telekom', icon: '🟣', color: '#e20074', match: ['telekom'] },
    { key: 'enel', name: 'PPC / Enel', icon: '💡', color: '#008a00', match: ['enel', 'ppc'] },
    { key: 'electrica', name: 'Electrica', icon: '⚡', color: '#004b93', match: ['electrica', 'furnizare'] },
    { key: 'eon', name: 'E.ON', icon: '🔥', color: '#ed1c24', match: ['eon', 'e.on'] },
    { key: 'engie', name: 'Engie', icon: '🔥', color: '#00aaff', match: ['engie'] },
    { key: 'hidroelectrica', name: 'Hidroelectrica', icon: '💧', color: '#006699', match: ['hidroelectrica'] },
    { key: 'apanova', name: 'Apa Nova', icon: '🚰', color: '#0077c8', match: ['apa nova', 'apanova', 'raja', 'aquatim', 'compania de apa'] },

    // Bricolaj / Casă
    { key: 'dedeman', name: 'Dedeman', icon: '🔨', color: '#ff6a00', match: ['dedeman'] },
    { key: 'leroy', name: 'Leroy Merlin', icon: '📐', color: '#78be20', match: ['leroy', 'leroy merlin'] },
    { key: 'hornbach', name: 'Hornbach', icon: '🪚', color: '#fe6700', match: ['hornbach'] },
    { key: 'bricodepot', name: 'Brico Dépôt', icon: '🧰', color: '#da291c', match: ['brico depot', 'bricodepot'] },
    { key: 'ikea', name: 'IKEA', icon: '🛋️', color: '#0051ba', match: ['ikea'] },
    { key: 'jysk', name: 'JYSK', icon: '🛏️', color: '#002f6c', match: ['jysk'] },
    { key: 'mobexpert', name: 'Mobexpert', icon: '🪑', color: '#582c83', match: ['mobexpert'] },

    // Carburant / Transport
    { key: 'omv', name: 'OMV', icon: '⛽', color: '#00519e', match: ['omv'] },
    { key: 'petrom', name: 'Petrom', icon: '⛽', color: '#003366', match: ['petrom'] },
    { key: 'rompetrol', name: 'Rompetrol', icon: '⛽', color: '#df1e26', match: ['rompetrol'] },
    { key: 'mol', name: 'MOL', icon: '⛽', color: '#009a44', match: ['mol'] },
    { key: 'lukoil', name: 'Lukoil', icon: '⛽', color: '#ed1b2d', match: ['lukoil'] },
    { key: 'socar', name: 'Socar', icon: '⛽', color: '#002f6c', match: ['socar'] },
    { key: 'uber', name: 'Uber', icon: '🚗', color: '#000000', match: ['uber'] },
    { key: 'bolt', name: 'Bolt', icon: '🚗', color: '#34d186', match: ['bolt'] },
    { key: 'cfr', name: 'CFR Călători', icon: '🚆', color: '#003399', match: ['cfr', 'tren'] },
    { key: 'wizz', name: 'Wizz Air / Zbor', icon: '✈️', color: '#c6007e', match: ['wizz', 'wizzair', 'tarom', 'ryanair', 'aeroport', 'avion'] },

    // Farmacie & Sănătate
    { key: 'catena', name: 'Catena', icon: '💊', color: '#00a651', match: ['catena'] },
    { key: 'drmax', name: 'Dr. Max / Sensiblu', icon: '💊', color: '#00833e', match: ['dr max', 'drmax', 'sensiblu'] },
    { key: 'helpnet', name: 'Help Net', icon: '💊', color: '#009639', match: ['help net', 'helpnet'] },
    { key: 'farmaciatei', name: 'Farmacia Tei / Bebe Tei', icon: '💊', color: '#0066b2', match: ['farmacia tei', 'bebe tei', 'tei'] },
    { key: 'dm', name: 'DM Drogerie', icon: '💄', color: '#ffdd00', match: ['dm', 'dm drogerie'] },
    { key: 'reginamaria', name: 'Regina Maria / MedLife', icon: '🏥', color: '#003399', match: ['regina maria', 'medlife', 'synevo', 'clinica', 'spital', 'policlinica'] },

    // Food Delivery / Restaurant
    { key: 'glovo', name: 'Glovo', icon: '🛵', color: '#ffc244', match: ['glovo'] },
    { key: 'tazz', name: 'Tazz', icon: '🛵', color: '#e50914', match: ['tazz'] },
    { key: 'mcdonalds', name: 'McDonald\'s', icon: '🍔', color: '#ffbc0d', match: ['mcdonalds', 'mcdonald', 'mc donalds', 'mcd'] },
    { key: 'kfc', name: 'KFC', icon: '🍗', color: '#a3080c', match: ['kfc'] },
    { key: 'burgerking', name: 'Burger King', icon: '🍔', color: '#d62300', match: ['burger king', 'burgerking'] },
    { key: 'pizzahut', name: 'Pizza Hut / Pizzerie', icon: '🍕', color: '#ee3124', match: ['pizza', 'pizza hut', 'dodo pizza', 'pizzahut', 'trattoria', 'ristorante'] },
    { key: 'starbucks', name: 'Starbucks / Cafenea', icon: '☕', color: '#00704a', match: ['starbucks', '5 to go', '5togo', 'cafenea', 'coffee', 'espresso', 'cafe'] },
    { key: 'restaurant', name: 'Restaurant / Fast-Food', icon: '🍽️', color: '#8b5cf6', match: ['restaurant', 'kebab', 'shaorma', 'fast food', 'fastfood', 'bistro', 'cantina'] },

    // Fashion / Shopping
    { key: 'zara', name: 'Zara / H&M / Haine', icon: '👗', color: '#a855f7', match: ['zara', 'h&m', 'hm', 'pepco', 'sinsay', 'bershka', 'pull&bear', 'stradivarius', 'reserved', 'mohito', 'kik', 'takko'] },
    { key: 'decathlon', name: 'Decathlon / Sport', icon: '⚽', color: '#0082c3', match: ['decathlon', 'intersport', 'sportisimo', 'hervis', 'nike', 'adidas', 'puma'] }
];

function detectMerchantFromTransaction(tx) {
    if (!tx || tx.type !== 'expense') return null;

    const rawMerchant = (tx.merchant || '').trim();
    const desc = (tx.description || '').toLowerCase().trim();
    const cat = appData.categories.find(c => c.id === tx.categoryId);
    const catName = cat ? (cat.name || '').toLowerCase() : '';

    // 1. Verificare comerciant personalizat definit în setări
    if (appData.settings && Array.isArray(appData.settings.customMerchants)) {
        if (rawMerchant) {
            const customM = appData.settings.customMerchants.find(m => m && m.name && m.name.toLowerCase().trim() === rawMerchant.toLowerCase());
            if (customM) {
                return {
                    key: customM.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    name: customM.name,
                    icon: customM.icon || (cat ? cat.icon : '🏪'),
                    color: customM.color || (cat ? cat.color : '#6366f1')
                };
            }
        }
        if (desc) {
            const customM = appData.settings.customMerchants.find(m => m && m.name && (desc === m.name.toLowerCase().trim() || desc.includes(m.name.toLowerCase().trim())));
            if (customM) {
                return {
                    key: customM.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    name: customM.name,
                    icon: customM.icon || (cat ? cat.icon : '🏪'),
                    color: customM.color || (cat ? cat.color : '#6366f1')
                };
            }
        }
    }

    // 2. Căutare după rawMerchant dacă este setat
    if (rawMerchant) {
        const rawLower = rawMerchant.toLowerCase();
        // Căutare exactă sau parțială în KNOWN_MERCHANTS
        const found = KNOWN_MERCHANTS.find(m => {
            if (m.name.toLowerCase() === rawLower || m.key === rawLower) return true;
            if (m.match && m.match.some(keyword => rawLower.includes(keyword) || keyword.includes(rawLower))) return true;
            return false;
        });

        if (found) {
            return {
                key: found.key,
                name: rawMerchant,
                icon: found.icon,
                color: found.color
            };
        }

        // Dacă nu e găsit în preseturi, deducem icon și color din cuvinte cheie generale, categorie sau hash
        let resolvedIcon = null;
        let resolvedColor = null;

        // Reguli inteligente de cuvinte cheie din numele comerciantului
        if (rawLower.includes('farmaci') || rawLower.includes('sensiblu') || rawLower.includes('catena') || rawLower.includes('helpnet') || rawLower.includes('remed') || rawLower.includes('medic') || rawLower.includes('doctor')) {
            resolvedIcon = '💊';
            resolvedColor = '#059669';
        } else if (rawLower.includes('cafe') || rawLower.includes('coffee') || rawLower.includes('espresso') || rawLower.includes('bar') || rawLower.includes('ceai')) {
            resolvedIcon = '☕';
            resolvedColor = '#92400e';
        } else if (rawLower.includes('pizza')) {
            resolvedIcon = '🍕';
            resolvedColor = '#ea580c';
        } else if (rawLower.includes('burger') || rawLower.includes('kebab') || rawLower.includes('shaorma') || rawLower.includes('fastfood') || rawLower.includes('grill') || rawLower.includes('gyros')) {
            resolvedIcon = '🍔';
            resolvedColor = '#d97706';
        } else if (rawLower.includes('brutar') || rawLower.includes('panific') || rawLower.includes('covrig') || rawLower.includes('patiser') || rawLower.includes('simig')) {
            resolvedIcon = '🥖';
            resolvedColor = '#d97706';
        } else if (rawLower.includes('macelar') || rawLower.includes('carne') || rawLower.includes('carmanger') || rawLower.includes('mezel')) {
            resolvedIcon = '🥩';
            resolvedColor = '#dc2626';
        } else if (rawLower.includes('cofetar') || rawLower.includes('dulce') || rawLower.includes('prajitur') || rawLower.includes('tort')) {
            resolvedIcon = '🍰';
            resolvedColor = '#db2777';
        } else if (rawLower.includes('benzin') || rawLower.includes('combustibil') || rawLower.includes('carburant') || rawLower.includes('peco') || rawLower.includes('diesel') || rawLower.includes('benzina')) {
            resolvedIcon = '⛽';
            resolvedColor = '#0284c7';
        } else if (rawLower.includes('taxi') || rawLower.includes('curier') || rawLower.includes('livrare') || rawLower.includes('transport')) {
            resolvedIcon = '🚗';
            resolvedColor = '#10b981';
        } else if (rawLower.includes('digi') || rawLower.includes('vodafone') || rawLower.includes('orange') || rawLower.includes('telekom') || rawLower.includes('internet') || rawLower.includes('tv')) {
            resolvedIcon = '📶';
            resolvedColor = '#3b82f6';
        } else if (rawLower.includes('enel') || rawLower.includes('electrica') || rawLower.includes('curent') || rawLower.includes('gaz') || rawLower.includes('apa ') || rawLower.includes('salubritate')) {
            resolvedIcon = '💡';
            resolvedColor = '#eab308';
        } else if (rawLower.includes('haine') || rawLower.includes('pantofi') || rawLower.includes('incaltaminte') || rawLower.includes('fashion') || rawLower.includes('boutique') || rawLower.includes('textil')) {
            resolvedIcon = '👗';
            resolvedColor = '#a855f7';
        } else if (rawLower.includes('mobila') || rawLower.includes('dedeman') || rawLower.includes('leroy') || rawLower.includes('brico') || rawLower.includes('ikea') || rawLower.includes('jysk') || rawLower.includes('construct')) {
            resolvedIcon = '🔨';
            resolvedColor = '#ea580c';
        } else if (rawLower.includes('market') || rawLower.includes('magazin') || rawLower.includes('supermarket') || rawLower.includes('chiosc') || rawLower.includes('alimentar') || rawLower.includes('bacanie') || rawLower.includes('minimarket')) {
            resolvedIcon = '🏪';
            resolvedColor = '#2563eb';
        }

        if (!resolvedIcon && cat && cat.icon) {
            resolvedIcon = cat.icon;
            resolvedColor = cat.color || '#6366f1';
        }

        if (!resolvedColor) {
            const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];
            let hash = 0;
            for (let i = 0; i < rawLower.length; i++) {
                hash = rawLower.charCodeAt(i) + ((hash << 5) - hash);
            }
            resolvedColor = palette[Math.abs(hash) % palette.length];
        }

        return {
            key: rawLower.replace(/[^a-z0-9]/g, '_'),
            name: rawMerchant,
            icon: resolvedIcon || '🏪',
            color: resolvedColor
        };
    }

    // 3. Căutare în descriere dacă merchant nu este setat explicit
    if (desc) {
        for (const m of KNOWN_MERCHANTS) {
            if (m.match && m.match.some(keyword => desc.includes(keyword))) {
                return {
                    key: m.key,
                    name: m.name,
                    icon: m.icon,
                    color: m.color
                };
            }
        }
    }

    return null;
}

function openKpiDetailModal(metricKey) {
    const modal = document.getElementById('modalKpiDetail');
    if (!modal) return;

    const modalIconEl = document.getElementById('kpiDetailModalIcon');
    const modalTitleEl = document.getElementById('kpiDetailModalTitle');
    const modalSubEl = document.getElementById('kpiDetailModalSub');
    const modalBodyEl = document.getElementById('kpiDetailModalBody');
    if (!modalBodyEl) return;

    const filteredTxs = getFilteredTransactionsForStats();
    const mainCurr = getActiveCurrency();
    const activeLang = getLanguageForCurrency();
    const daysCount = getDaysInStatsPeriod();

    const isCashTx = (tx) => !!(tx && ((tx.paymentMethod === 'cash') || (tx.account === 'cash') || (typeof tx.paymentMethod === 'string' && tx.paymentMethod.toLowerCase() === 'cash') || (typeof tx.account === 'string' && tx.account.toLowerCase() === 'cash')));

    let totIncomeRon = 0;
    let totExpenseRon = 0;
    let peakExpenseTx = null;
    let peakIncomeTx = null;
    let expenseCount = 0;
    let incomeCount = 0;
    let transferCount = 0;
    let cardExpenseRon = 0;
    let cashExpenseRon = 0;
    let cardExpenseCount = 0;
    let cashExpenseCount = 0;
    let cardIncomeRon = 0;
    let cashIncomeRon = 0;
    let cardIncomeCount = 0;
    let cashIncomeCount = 0;

    const categoryMap = {};
    const incomeSourceMap = {};
    const daysWithExpenses = new Set();
    const weekdayExpenseMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 0: 0 };

    filteredTxs.forEach(t => {
        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        const cash = isCashTx(t);

        if (t.type === 'income') {
            totIncomeRon += amtRon;
            incomeCount++;
            if (cash) {
                cashIncomeRon += amtRon;
                cashIncomeCount++;
            } else {
                cardIncomeRon += amtRon;
                cardIncomeCount++;
            }
            if (!peakIncomeTx || amtRon > (parseFloat(peakIncomeTx.amountInRon) || parseFloat(peakIncomeTx.amount) || 0)) {
                peakIncomeTx = t;
            }
            const src = (t.description && t.description.trim()) ? t.description.trim() : (activeLang === 'ro' ? 'Venit Diverse' : 'Income');
            if (!incomeSourceMap[src]) incomeSourceMap[src] = { name: src, totalRon: 0, count: 0, txs: [] };
            incomeSourceMap[src].totalRon += amtRon;
            incomeSourceMap[src].count++;
            incomeSourceMap[src].txs.push(t);
        } else if (t.type === 'expense') {
            totExpenseRon += amtRon;
            expenseCount++;
            if (t.date) daysWithExpenses.add(t.date);
            if (!peakExpenseTx || amtRon > (parseFloat(peakExpenseTx.amountInRon) || parseFloat(peakExpenseTx.amount) || 0)) {
                peakExpenseTx = t;
            }
            if (cash) {
                cashExpenseRon += amtRon;
                cashExpenseCount++;
            } else {
                cardExpenseRon += amtRon;
                cardExpenseCount++;
            }
            const catId = t.categoryId || 'other';
            if (!categoryMap[catId]) {
                const catObj = appData.categories.find(c => c.id === catId) || { name: 'Diverse', icon: '📦', color: '#64748b' };
                categoryMap[catId] = { name: catObj.name, icon: catObj.icon, color: catObj.color || '#3b82f6', totalRon: 0, count: 0 };
            }
            categoryMap[catId].totalRon += amtRon;
            categoryMap[catId].count++;

            if (t.date) {
                const dayOfWeek = new Date(t.date).getDay();
                weekdayExpenseMap[dayOfWeek] += amtRon;
            }
        } else if (t.type === 'transfer') {
            transferCount++;
        }
    });

    let totalBalRon = 0;
    let cardBalRon = 0;
    let cashBalRon = 0;
    appData.transactions.forEach(t => {
        if (isTxSuspended(t)) return;
        const a = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        const cash = isCashTx(t);
        if (t.type === 'income') {
            totalBalRon += a;
            if (cash) cashBalRon += a;
            else cardBalRon += a;
        } else if (t.type === 'expense') {
            totalBalRon -= a;
            if (cash) cashBalRon -= a;
            else cardBalRon -= a;
        } else if (t.type === 'transfer') {
            const dir = t.transferDirection || t.direction || 'card-to-cash';
            if (dir === 'card-to-cash') {
                cardBalRon -= a;
                cashBalRon += a;
            } else {
                cashBalRon -= a;
                cardBalRon += a;
            }
        }
    });

    const netSavingsRon = totIncomeRon - totExpenseRon;
    const savingsRate = totIncomeRon > 0 ? ((netSavingsRon / totIncomeRon) * 100).toFixed(1) : (netSavingsRon >= 0 ? '0.0' : '-');
    const dailyAvgRon = totExpenseRon / Math.max(1, daysCount);
    const dailyIncomeRon = totIncomeRon / Math.max(1, daysCount);
    const daysRunway = calculateGlobalRunwayDays();

    let periodText = 'Luna curentă';
    if (currentStatsPeriod === 'month') periodText = activeLang === 'ro' ? 'Luna Aceasta' : 'This Month';
    else if (currentStatsPeriod === '3months') periodText = activeLang === 'ro' ? 'Ultimele 3 Luni' : 'Last 3 Months';
    else if (currentStatsPeriod === 'year') {
        const ySel = document.getElementById('statsYearSelect');
        const yr = ySel && ySel.value ? ySel.value : new Date().getFullYear();
        periodText = `${activeLang === 'ro' ? 'Anul' : 'Year'} ${yr}`;
    } else if (currentStatsPeriod === 'all') {
        periodText = activeLang === 'ro' ? 'Toată Perioada' : 'All Time';
    }

    if (modalSubEl) modalSubEl.textContent = `${periodText} • ${daysCount} ${activeLang === 'ro' ? 'zile' : 'days'}`;

    let html = '';

    if (metricKey === 'income') {
        if (modalIconEl) modalIconEl.textContent = '📈';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Venituri & Încasări' : 'Income & Receipts';

        const avgPerIncomeRon = incomeCount > 0 ? (totIncomeRon / incomeCount) : 0;
        const peakAmt = peakIncomeTx ? (parseFloat(peakIncomeTx.amountInRon) || parseFloat(peakIncomeTx.amount) || 0) : 0;
        const incomeSources = Object.values(incomeSourceMap).sort((a, b) => b.totalRon - a.totalRon);
        const incomeTxs = filteredTxs.filter(t => t.type === 'income').sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id - a.id));

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid #10b981;">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Total Încasat în Perioadă' : 'Total Income in Period'}</div>
                <div class="kpi-detail-hero-val income-color">${formatMoney(convertFromRon(totIncomeRon, mainCurr), mainCurr)}</div>
                <div class="kpi-detail-hero-sub">${incomeCount} ${activeLang === 'ro' ? 'încasări înregistrate' : 'receipts recorded'}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Medie per Încasare' : 'Average per Receipt'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(avgPerIncomeRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Ritm Mediu Zilnic' : 'Daily Income Rate'}</div>
                    <div class="kpi-detail-mini-val income-color">${formatMoney(convertFromRon(dailyIncomeRon, mainCurr), mainCurr)}/zi</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Cea mai mare Încasare' : 'Peak Single Income'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(peakAmt, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Excedent / Economii' : 'Net Surplus'}</div>
                    <div class="kpi-detail-mini-val ${netSavingsRon >= 0 ? 'income-color' : 'expense-color'}">${formatMoney(convertFromRon(netSavingsRon, mainCurr), mainCurr)}</div>
                </div>
            </div>

            <div class="kpi-detail-advice-card">
                ${netSavingsRon >= 0 
                    ? `💡 <strong>Bilanț Pozitiv:</strong> Ai încasat mai mult decât ai cheltuit cu <strong>${formatMoney(convertFromRon(netSavingsRon, mainCurr), mainCurr)}</strong> (${savingsRate}% rată de economisire).` 
                    : `⚠️ <strong>Atenție:</strong> În această perioadă cheltuielile depășesc veniturile încasate cu <strong>${formatMoney(convertFromRon(Math.abs(netSavingsRon), mainCurr), mainCurr)}</strong>.`}
            </div>

            <div class="kpi-detail-section-title">
                <span>💼 ${activeLang === 'ro' ? 'Repartizare pe Surse / Descrieri' : 'Income Sources'}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${incomeSources.length} ${activeLang === 'ro' ? 'surse' : 'sources'}</span>
            </div>
            <div style="margin-bottom: 14px;">
                ${incomeSources.length === 0 ? `<div style="text-align:center; padding:15px; color:var(--text-muted); font-size:0.8rem;">Nu există încasări în această perioadă.</div>` : ''}
                ${incomeSources.map(src => {
                    const pct = totIncomeRon > 0 ? ((src.totalRon / totIncomeRon) * 100).toFixed(1) : 0;
                    return `
                        <div class="kpi-detail-row-item">
                            <div class="kpi-detail-row-left">
                                <div class="kpi-detail-row-icon" style="color: #10b981;">💰</div>
                                <div class="kpi-detail-row-info">
                                    <div class="kpi-detail-row-name">${escapeHtml(src.name)}</div>
                                    <div class="kpi-detail-row-meta">${src.count} ${activeLang === 'ro' ? 'încasări' : 'tx'} • ${pct}% din total</div>
                                    <div class="kpi-detail-progress-track">
                                        <div class="kpi-detail-progress-bar" style="width: ${pct}%; background: #10b981;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="kpi-detail-row-right">
                                <div class="kpi-detail-row-amt income-color">${formatMoney(convertFromRon(src.totalRon, mainCurr), mainCurr)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="kpi-detail-section-title">
                <span>🕒 ${activeLang === 'ro' ? 'Istoric Încasări din Perioadă' : 'Income Receipts Log'}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${incomeTxs.length} ${activeLang === 'ro' ? 'tranzacții' : 'tx'}</span>
            </div>
            <div style="margin-bottom: 6px;">
                ${incomeTxs.map(t => {
                    const amt = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                    const accIcon = isCashTx(t) ? '💵 Cash' : '💳 Card';
                    return `
                        <div class="kpi-detail-row-item">
                            <div class="kpi-detail-row-left">
                                <div class="kpi-detail-row-icon" style="color: #10b981;">📈</div>
                                <div class="kpi-detail-row-info">
                                    <div class="kpi-detail-row-name">${escapeHtml(t.description || (activeLang === 'ro' ? 'Venit' : 'Income'))}</div>
                                    <div class="kpi-detail-row-meta">${formatDateDisplay(t.date)}${t.time ? ' ' + t.time : ''} • ${accIcon}</div>
                                </div>
                            </div>
                            <div class="kpi-detail-row-right">
                                <div class="kpi-detail-row-amt income-color">+${formatMoney(convertFromRon(amt, mainCurr), mainCurr)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (metricKey === 'expense') {
        if (modalIconEl) modalIconEl.textContent = '📉';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Cheltuieli & Plăți' : 'Expenses & Payments';

        const avgTicketRon = expenseCount > 0 ? (totExpenseRon / expenseCount) : 0;
        const peakAmt = peakExpenseTx ? (parseFloat(peakExpenseTx.amountInRon) || parseFloat(peakExpenseTx.amount) || 0) : 0;
        const categoriesList = Object.values(categoryMap).sort((a, b) => b.totalRon - a.totalRon);
        const top5Expenses = filteredTxs
            .filter(t => t.type === 'expense')
            .sort((a, b) => (parseFloat(b.amountInRon) || parseFloat(b.amount) || 0) - (parseFloat(a.amountInRon) || parseFloat(a.amount) || 0))
            .slice(0, 5);

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid #ef4444;">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Total Cheltuit în Perioadă' : 'Total Spent in Period'}</div>
                <div class="kpi-detail-hero-val expense-color">${formatMoney(convertFromRon(totExpenseRon, mainCurr), mainCurr)}</div>
                <div class="kpi-detail-hero-sub">${expenseCount} ${activeLang === 'ro' ? 'plăți efectuate' : 'payments made'}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Coș Mediu per Plată' : 'Avg Spend per Payment'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(avgTicketRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Ritm Zilnic (Burn Rate)' : 'Daily Burn Rate'}</div>
                    <div class="kpi-detail-mini-val expense-color">${formatMoney(convertFromRon(dailyAvgRon, mainCurr), mainCurr)}/zi</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Vârf Plată Unică' : 'Peak Single Expense'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(peakAmt, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Categorii Active' : 'Active Categories'}</div>
                    <div class="kpi-detail-mini-val">${categoriesList.length} ${activeLang === 'ro' ? 'categorii' : 'categories'}</div>
                </div>
            </div>

            <div class="kpi-detail-advice-card">
                ${totIncomeRon > 0 
                    ? `📊 Cheltuielile reprezintă <strong>${((totExpenseRon / totIncomeRon) * 100).toFixed(1)}%</strong> din totalul veniturilor tale din această perioadă.` 
                    : `ℹ️ Ai efectuat ${expenseCount} plăți totalizând <strong>${formatMoney(convertFromRon(totExpenseRon, mainCurr), mainCurr)}</strong>.`}
            </div>

            <div class="kpi-detail-section-title">
                <span>🏷️ ${activeLang === 'ro' ? 'Top Categorii de Cheltuieli' : 'Expenses by Category'}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">${categoriesList.length} ${activeLang === 'ro' ? 'categorii' : 'categories'}</span>
            </div>
            <div style="margin-bottom: 14px;">
                ${categoriesList.length === 0 ? `<div style="text-align:center; padding:15px; color:var(--text-muted); font-size:0.8rem;">Nu există cheltuieli în această perioadă.</div>` : ''}
                ${categoriesList.map(c => {
                    const pct = totExpenseRon > 0 ? ((c.totalRon / totExpenseRon) * 100).toFixed(1) : 0;
                    return `
                        <div class="kpi-detail-row-item">
                            <div class="kpi-detail-row-left">
                                <div class="kpi-detail-row-icon">${c.icon}</div>
                                <div class="kpi-detail-row-info">
                                    <div class="kpi-detail-row-name">${escapeHtml(c.name)}</div>
                                    <div class="kpi-detail-row-meta">${c.count} ${activeLang === 'ro' ? 'plăți' : 'payments'} • ${pct}% din total</div>
                                    <div class="kpi-detail-progress-track">
                                        <div class="kpi-detail-progress-bar" style="width: ${pct}%; background: ${c.color};"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="kpi-detail-row-right">
                                <div class="kpi-detail-row-amt expense-color">${formatMoney(convertFromRon(c.totalRon, mainCurr), mainCurr)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="kpi-detail-section-title">
                <span>⚡ ${activeLang === 'ro' ? 'Top 5 Cele Mai Mari Plăți' : 'Top 5 Largest Payments'}</span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">TOP 5</span>
            </div>
            <div style="margin-bottom: 6px;">
                ${top5Expenses.map((t, idx) => {
                    const amt = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                    const cat = appData.categories.find(c => c.id === t.categoryId) || { name: 'Diverse', icon: '⚡' };
                    const payLabel = isCashTx(t) ? '💵 Cash' : '💳 Card';
                    return `
                        <div class="kpi-detail-row-item">
                            <div class="kpi-detail-row-left">
                                <div class="kpi-detail-row-icon">#${idx + 1}</div>
                                <div class="kpi-detail-row-info">
                                    <div class="kpi-detail-row-name">${cat.icon} ${escapeHtml(t.description || cat.name)}</div>
                                    <div class="kpi-detail-row-meta">${formatDateDisplay(t.date)} • ${payLabel}</div>
                                </div>
                            </div>
                            <div class="kpi-detail-row-right">
                                <div class="kpi-detail-row-amt expense-color">${formatMoney(convertFromRon(amt, mainCurr), mainCurr)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (metricKey === 'savings') {
        if (modalIconEl) modalIconEl.textContent = '💎';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Sold Net & Bilanț Financiar' : 'Net Savings & Balance';

        const expPctOfInc = totIncomeRon > 0 ? Math.min(100, (totExpenseRon / totIncomeRon) * 100).toFixed(1) : 0;
        const savPctOfInc = totIncomeRon > 0 ? Math.max(0, (netSavingsRon / totIncomeRon) * 100).toFixed(1) : 0;
        const netDailyRon = netSavingsRon / Math.max(1, daysCount);

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid ${netSavingsRon >= 0 ? '#10b981' : '#ef4444'};">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Sold Net (Bilanț Perioadă)' : 'Net Cashflow (Period Balance)'}</div>
                <div class="kpi-detail-hero-val ${netSavingsRon >= 0 ? 'income-color' : 'expense-color'}">
                    ${netSavingsRon >= 0 ? '+' : ''}${formatMoney(convertFromRon(netSavingsRon, mainCurr), mainCurr)}
                </div>
                <div class="kpi-detail-hero-sub">${netSavingsRon >= 0 ? (activeLang === 'ro' ? 'Excedent financiar păstrat' : 'Net savings retained') : (activeLang === 'ro' ? 'Deficit în această perioadă' : 'Deficit in this period')}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Total Încasat (+)' : 'Total Inflows (+)'}</div>
                    <div class="kpi-detail-mini-val income-color">${formatMoney(convertFromRon(totIncomeRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Total Cheltuit (-)' : 'Total Outflows (-)'}</div>
                    <div class="kpi-detail-mini-val expense-color">${formatMoney(convertFromRon(totExpenseRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? '% Păstrat din Venit' : '% Retained'}</div>
                    <div class="kpi-detail-mini-val">${savingsRate}%</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Economie Medie / zi' : 'Daily Net Savings'}</div>
                    <div class="kpi-detail-mini-val ${netDailyRon >= 0 ? 'income-color' : 'expense-color'}">${formatMoney(convertFromRon(netDailyRon, mainCurr), mainCurr)}/zi</div>
                </div>
            </div>

            <div style="background: var(--item-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 12px;">
                <div style="font-size: 0.78rem; font-weight: 700; margin-bottom: 6px; display: flex; justify-content: space-between;">
                    <span>⚖️ ${activeLang === 'ro' ? 'Distribuție Venituri: Cheltuieli vs Economii' : 'Income Allocation: Spent vs Saved'}</span>
                </div>
                <div style="height: 14px; border-radius: 7px; background: #374151; display: flex; overflow: hidden; margin-bottom: 8px;">
                    <div style="width: ${expPctOfInc}%; background: #ef4444;" title="Cheltuieli: ${expPctOfInc}%"></div>
                    <div style="width: ${savPctOfInc}%; background: #10b981;" title="Economii: ${savPctOfInc}%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted);">
                    <span style="color: #ef4444; font-weight: 700;">🔴 Cheltuieli: ${expPctOfInc}%</span>
                    <span style="color: #10b981; font-weight: 700;">🟢 Economii Nete: ${savPctOfInc}%</span>
                </div>
            </div>

            <div class="kpi-detail-advice-card">
                ${netSavingsRon >= 0 
                    ? `🎯 <strong>Felicitări!</strong> Ritmul tău financiar generează un surplus de <strong>${formatMoney(convertFromRon(netDailyRon, mainCurr), mainCurr)} pe zi</strong>. Acești bani contribuie direct la creșterea autonomiei tale financiare.` 
                    : `⚠️ <strong>Recomandare:</strong> Pentru a restabili echilibrul, încearcă să reduci plățile zilnice cu aproximativ <strong>${formatMoney(convertFromRon(Math.abs(netDailyRon), mainCurr), mainCurr)}/zi</strong>.`}
            </div>
        `;
    } else if (metricKey === 'rate') {
        if (modalIconEl) modalIconEl.textContent = '🎯';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Rata de Economisire' : 'Savings Rate';

        const rateNum = parseFloat(savingsRate) || 0;
        let healthLabel = 'Moderată';
        let healthColor = '#f59e0b';
        let adviceText = '';

        if (rateNum >= 30) {
            healthLabel = activeLang === 'ro' ? 'Excelentă (Fortăreață)' : 'Excellent';
            healthColor = '#10b981';
            adviceText = 'Economisești peste 30% din venituri! Ești într-o zonă de siguranță financiară superioară, excelentă pentru investiții pe termen lung.';
        } else if (rateNum >= 20) {
            healthLabel = activeLang === 'ro' ? 'Foarte Bună (Standard 50/30/20)' : 'Very Good';
            healthColor = '#10b981';
            adviceText = 'Atingi standardul de aur al regulii 50/30/20 (minim 20% economii). Menține acest ritm sănătos!';
        } else if (rateNum >= 10) {
            healthLabel = activeLang === 'ro' ? 'Moderat Bună' : 'Moderate';
            healthColor = '#3b82f6';
            adviceText = 'Economisești o parte din bani, dar ai putea optimiza micile cheltuieli recurente pentru a ajunge la pragul recomandat de 20%.';
        } else if (rateNum > 0) {
            healthLabel = activeLang === 'ro' ? 'Redusă' : 'Low';
            healthColor = '#f59e0b';
            adviceText = 'Rata de economisire este sub 10%. O cheltuială neprevăzută îți poate afecta bugetul. Recomandăm revizuirea categoriilor de top.';
        } else {
            healthLabel = activeLang === 'ro' ? 'Negativă / Fără Economii' : 'Negative';
            healthColor = '#ef4444';
            adviceText = 'Cheltuielile au depășit veniturile în această perioadă. Este util să identifici plățile neesențiale din tab-ul Statistici.';
        }

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid ${healthColor};">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Rata Reală de Economisire' : 'Actual Savings Rate'}</div>
                <div class="kpi-detail-hero-val" style="color: ${healthColor};">${savingsRate}%</div>
                <div class="kpi-detail-hero-sub">${activeLang === 'ro' ? 'din veniturile încasate au fost păstrate' : 'of earned income retained'}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Calificativ Buget' : 'Budget Rating'}</div>
                    <div class="kpi-detail-mini-val" style="color: ${healthColor}; font-size: 0.85rem;">${healthLabel}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Standard Recomandat' : 'Target Rate'}</div>
                    <div class="kpi-detail-mini-val income-color">≥ 20.0%</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Economii Nete' : 'Net Savings'}</div>
                    <div class="kpi-detail-mini-val ${netSavingsRon >= 0 ? 'income-color' : 'expense-color'}">${formatMoney(convertFromRon(netSavingsRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Venituri de Bază' : 'Base Inflows'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(totIncomeRon, mainCurr), mainCurr)}</div>
                </div>
            </div>

            <div class="kpi-detail-advice-card">
                💡 <strong>Diagnostic & Ghid 50/30/20:</strong><br>
                ${adviceText}
            </div>

            <div style="background: var(--item-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
                <div style="font-size: 0.80rem; font-weight: 700; margin-bottom: 8px;">🎯 Ghid Praguri de Economisire:</div>
                <div style="font-size: 0.74rem; color: var(--text-color); display: flex; flex-direction: column; gap: 6px;">
                    <div>🟢 <strong>≥ 30%:</strong> Libertate Financiară accelerată</div>
                    <div>🟢 <strong>20% – 30%:</strong> Standardul Recomandat (Regula 50/30/20)</div>
                    <div>🔵 <strong>10% – 20%:</strong> Nivel Bun de stabilitate</div>
                    <div>🟡 <strong>0% – 10%:</strong> Zonă vulnerabilă la neprevăzut</div>
                    <div>🔴 <strong>< 0%:</strong> Deficit bugetar</div>
                </div>
            </div>
        `;
    } else if (metricKey === 'daily_avg') {
        if (modalIconEl) modalIconEl.textContent = '⏱️';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Ritm Zilnic de Cheltuire (Burn Rate)' : 'Daily Burn Rate';

        const daysWithExpensesCount = daysWithExpenses.size;
        const zeroSpendDaysCount = Math.max(0, daysCount - daysWithExpensesCount);
        const weekdayNames = activeLang === 'ro' 
            ? ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'] 
            : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        let maxWeekdayIdx = 1;
        let maxWeekdayAmt = 0;
        for (let d = 0; d < 7; d++) {
            if (weekdayExpenseMap[d] > maxWeekdayAmt) {
                maxWeekdayAmt = weekdayExpenseMap[d];
                maxWeekdayIdx = d;
            }
        }

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid #f59e0b;">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Medie Plăți / Zi (Burn Rate)' : 'Daily Spend Pace'}</div>
                <div class="kpi-detail-hero-val expense-color">${formatMoney(convertFromRon(dailyAvgRon, mainCurr), mainCurr)}/zi</div>
                <div class="kpi-detail-hero-sub">${activeLang === 'ro' ? `calculat pe durata a ${daysCount} zile din perioada selectată` : `calculated across ${daysCount} days in period`}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Zile cu Plăți Active' : 'Active Spending Days'}</div>
                    <div class="kpi-detail-mini-val">${daysWithExpensesCount} ${activeLang === 'ro' ? 'zile' : 'days'}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Zile Fără Cheltuieli' : 'Zero-Spend Days'}</div>
                    <div class="kpi-detail-mini-val income-color">${zeroSpendDaysCount} ${activeLang === 'ro' ? 'zile' : 'days'}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Proiecție Lunară (30z)' : '30-Day Projection'}</div>
                    <div class="kpi-detail-mini-val expense-color">${formatMoney(convertFromRon(dailyAvgRon * 30, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Proiecție Anuală (365z)' : '365-Day Projection'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(dailyAvgRon * 365, mainCurr), mainCurr)}</div>
                </div>
            </div>

            <div class="kpi-detail-advice-card">
                📅 <strong>Ziua cu cel mai intens ritm de cheltuire:</strong> <strong>${weekdayNames[maxWeekdayIdx]}</strong> (${formatMoney(convertFromRon(maxWeekdayAmt, mainCurr), mainCurr)} total cheltuit în această perioadă).
            </div>

            <div class="kpi-detail-section-title">
                <span>🗓️ ${activeLang === 'ro' ? 'Cheltuieli pe Zilele Săptămânii' : 'Spending by Day of Week'}</span>
            </div>
            <div style="margin-bottom: 6px;">
                ${[1, 2, 3, 4, 5, 6, 0].map(d => {
                    const amt = weekdayExpenseMap[d] || 0;
                    const pct = totExpenseRon > 0 ? ((amt / totExpenseRon) * 100).toFixed(1) : 0;
                    return `
                        <div class="kpi-detail-row-item">
                            <div class="kpi-detail-row-left">
                                <div class="kpi-detail-row-icon">📅</div>
                                <div class="kpi-detail-row-info">
                                    <div class="kpi-detail-row-name">${weekdayNames[d]}</div>
                                    <div class="kpi-detail-row-meta">${pct}% din total cheltuieli</div>
                                    <div class="kpi-detail-progress-track">
                                        <div class="kpi-detail-progress-bar" style="width: ${pct}%; background: #f59e0b;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="kpi-detail-row-right">
                                <div class="kpi-detail-row-amt expense-color">${formatMoney(convertFromRon(amt, mainCurr), mainCurr)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else if (metricKey === 'peak_exp') {
        if (modalIconEl) modalIconEl.textContent = '⚡';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Vârf Cheltuială' : 'Peak Expense';

        const peakAmt = peakExpenseTx ? (parseFloat(peakExpenseTx.amountInRon) || parseFloat(peakExpenseTx.amount) || 0) : 0;
        const peakCat = peakExpenseTx ? (appData.categories.find(c => c.id === peakExpenseTx.categoryId) || { name: 'Cheltuială', icon: '⚡' }) : null;
        const peakPct = totExpenseRon > 0 ? ((peakAmt / totExpenseRon) * 100).toFixed(1) : 0;
        const top5Expenses = filteredTxs
            .filter(t => t.type === 'expense')
            .sort((a, b) => (parseFloat(b.amountInRon) || parseFloat(b.amount) || 0) - (parseFloat(a.amountInRon) || parseFloat(a.amount) || 0))
            .slice(0, 10);

        if (!peakExpenseTx) {
            html += `<div style="text-align:center; padding:30px; color:var(--text-muted);">Nu există cheltuieli în această perioadă.</div>`;
        } else {
            const peakPayLabel = isCashTx(peakExpenseTx) ? '💵 Cash' : '💳 Card';
            html += `
                <div class="kpi-detail-hero" style="border-left: 4px solid #ef4444;">
                    <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Cea Mai Mare Plată Unică' : 'Highest Single Expense'}</div>
                    <div class="kpi-detail-hero-val expense-color">${formatMoney(convertFromRon(peakAmt, mainCurr), mainCurr)}</div>
                    <div class="kpi-detail-hero-sub">${peakCat.icon} ${escapeHtml(peakCat.name)} • ${formatDateDisplay(peakExpenseTx.date)}</div>
                </div>

                <div class="kpi-detail-mini-grid">
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Pondere în Cheltuieli' : 'Share of Period Spend'}</div>
                        <div class="kpi-detail-mini-val expense-color">${peakPct}%</div>
                    </div>
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Metodă Plată' : 'Payment Method'}</div>
                        <div class="kpi-detail-mini-val">${peakPayLabel}</div>
                    </div>
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Descriere Plată' : 'Description'}</div>
                        <div class="kpi-detail-mini-val" style="font-size: 0.80rem;">${escapeHtml(peakExpenseTx.description || peakCat.name)}</div>
                    </div>
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Ora Înregistrării' : 'Timestamp'}</div>
                        <div class="kpi-detail-mini-val">${peakExpenseTx.time || '-'}</div>
                    </div>
                </div>

                <div class="kpi-detail-section-title">
                    <span>🏆 ${activeLang === 'ro' ? 'Clasament Cele Mai Mari Plăți din Perioadă' : 'Largest Expenses in Period'}</span>
                </div>
                <div style="margin-bottom: 6px;">
                    ${top5Expenses.map((t, idx) => {
                        const amt = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                        const cat = appData.categories.find(c => c.id === t.categoryId) || { name: 'Diverse', icon: '⚡' };
                        const share = totExpenseRon > 0 ? ((amt / totExpenseRon) * 100).toFixed(1) : 0;
                        const payLabel = isCashTx(t) ? '💵 Cash' : '💳 Card';
                        return `
                            <div class="kpi-detail-row-item">
                                <div class="kpi-detail-row-left">
                                    <div class="kpi-detail-row-icon" style="font-weight: 800; font-size: 0.8rem;">#${idx + 1}</div>
                                    <div class="kpi-detail-row-info">
                                        <div class="kpi-detail-row-name">${cat.icon} ${escapeHtml(t.description || cat.name)}</div>
                                        <div class="kpi-detail-row-meta">${formatDateDisplay(t.date)}${t.time ? ' ' + t.time : ''} • ${payLabel} • ${share}%</div>
                                    </div>
                                </div>
                                <div class="kpi-detail-row-right">
                                    <div class="kpi-detail-row-amt expense-color">${formatMoney(convertFromRon(amt, mainCurr), mainCurr)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    } else if (metricKey === 'daily_income') {
        if (modalIconEl) modalIconEl.textContent = '💰';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Medie Venit/zi & Ritm Câștig' : 'Daily Income Rate';

        const netDailyRon = dailyIncomeRon - dailyAvgRon;

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid #10b981;">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Medie Venituri / Zi' : 'Daily Income Pace'}</div>
                <div class="kpi-detail-hero-val income-color">${formatMoney(convertFromRon(dailyIncomeRon, mainCurr), mainCurr)}/zi</div>
                <div class="kpi-detail-hero-sub">${activeLang === 'ro' ? `pe durata a ${daysCount} zile calendaristice` : `across ${daysCount} calendar days`}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Cashflow Net Zilnic' : 'Net Daily Cashflow'}</div>
                    <div class="kpi-detail-mini-val ${netDailyRon >= 0 ? 'income-color' : 'expense-color'}">${formatMoney(convertFromRon(netDailyRon, mainCurr), mainCurr)}/zi</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Număr Încasări' : 'Income Events'}</div>
                    <div class="kpi-detail-mini-val">${incomeCount} ${activeLang === 'ro' ? 'încasări' : 'receipts'}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Proiecție Lunară (30z)' : '30-Day Inflow Proj.'}</div>
                    <div class="kpi-detail-mini-val income-color">${formatMoney(convertFromRon(dailyIncomeRon * 30, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Proiecție Anuală (365z)' : '365-Day Inflow Proj.'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(dailyIncomeRon * 365, mainCurr), mainCurr)}</div>
                </div>
            </div>

            <div class="kpi-detail-advice-card">
                📈 <strong>Comparație zilnică:</strong> Câștigi în medie <strong>${formatMoney(convertFromRon(dailyIncomeRon, mainCurr), mainCurr)}/zi</strong> și cheltuiești <strong>${formatMoney(convertFromRon(dailyAvgRon, mainCurr), mainCurr)}/zi</strong>.
                ${netDailyRon >= 0 
                    ? ` Rămâi cu un surplus zilnic de <strong>${formatMoney(convertFromRon(netDailyRon, mainCurr), mainCurr)}/zi</strong>.` 
                    : ` Ai un deficit zilnic de <strong>${formatMoney(convertFromRon(Math.abs(netDailyRon), mainCurr), mainCurr)}/zi</strong>.`}
            </div>
        `;
    } else if (metricKey === 'peak_inc') {
        if (modalIconEl) modalIconEl.textContent = '🌟';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Vârf Încasare' : 'Peak Income';

        const peakAmt = peakIncomeTx ? (parseFloat(peakIncomeTx.amountInRon) || parseFloat(peakIncomeTx.amount) || 0) : 0;
        const peakPct = totIncomeRon > 0 ? ((peakAmt / totIncomeRon) * 100).toFixed(1) : 0;
        const sortedIncomes = filteredTxs
            .filter(t => t.type === 'income')
            .sort((a, b) => (parseFloat(b.amountInRon) || parseFloat(b.amount) || 0) - (parseFloat(a.amountInRon) || parseFloat(a.amount) || 0));

        if (!peakIncomeTx) {
            html += `<div style="text-align:center; padding:30px; color:var(--text-muted);">Nu există încasări în această perioadă.</div>`;
        } else {
            const peakIncPayLabel = isCashTx(peakIncomeTx) ? '💵 Portofel Cash' : '💳 Cont Card';
            html += `
                <div class="kpi-detail-hero" style="border-left: 4px solid #10b981;">
                    <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Cea Mai Mare Încasare Unică' : 'Highest Single Income'}</div>
                    <div class="kpi-detail-hero-val income-color">${formatMoney(convertFromRon(peakAmt, mainCurr), mainCurr)}</div>
                    <div class="kpi-detail-hero-sub">💼 ${escapeHtml(peakIncomeTx.description || (activeLang === 'ro' ? 'Încasare' : 'Income'))} • ${formatDateDisplay(peakIncomeTx.date)}</div>
                </div>

                <div class="kpi-detail-mini-grid">
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Pondere în Venituri' : 'Share of Period Income'}</div>
                        <div class="kpi-detail-mini-val income-color">${peakPct}%</div>
                    </div>
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Destinație' : 'Account'}</div>
                        <div class="kpi-detail-mini-val">${peakIncPayLabel}</div>
                    </div>
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Data Încasării' : 'Date'}</div>
                        <div class="kpi-detail-mini-val">${formatDateDisplay(peakIncomeTx.date)}</div>
                    </div>
                    <div class="kpi-detail-mini-card">
                        <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Ora Înregistrării' : 'Timestamp'}</div>
                        <div class="kpi-detail-mini-val">${peakIncomeTx.time || '-'}</div>
                    </div>
                </div>

                <div class="kpi-detail-section-title">
                    <span>🏆 ${activeLang === 'ro' ? 'Clasament Încasări din Perioadă' : 'All Income Inflows in Period'}</span>
                </div>
                <div style="margin-bottom: 6px;">
                    ${sortedIncomes.map((t, idx) => {
                        const amt = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                        const share = totIncomeRon > 0 ? ((amt / totIncomeRon) * 100).toFixed(1) : 0;
                        const payLabel = isCashTx(t) ? '💵 Cash' : '💳 Card';
                        return `
                            <div class="kpi-detail-row-item">
                                <div class="kpi-detail-row-left">
                                    <div class="kpi-detail-row-icon" style="color: #10b981; font-weight: 800; font-size: 0.8rem;">#${idx + 1}</div>
                                    <div class="kpi-detail-row-info">
                                        <div class="kpi-detail-row-name">${escapeHtml(t.description || (activeLang === 'ro' ? 'Încasare' : 'Income'))}</div>
                                        <div class="kpi-detail-row-meta">${formatDateDisplay(t.date)}${t.time ? ' ' + t.time : ''} • ${payLabel} • ${share}%</div>
                                    </div>
                                </div>
                                <div class="kpi-detail-row-right">
                                    <div class="kpi-detail-row-amt income-color">+${formatMoney(convertFromRon(amt, mainCurr), mainCurr)}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
    } else if (metricKey === 'runway') {
        if (modalIconEl) modalIconEl.textContent = '🛡️';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Autonomie Financiară & Rezerve' : 'Financial Runway & Reserves';

        let safetyBadge = 'Moderat';
        let safetyColor = '#3b82f6';
        if (daysRunway >= 180) {
            safetyBadge = activeLang === 'ro' ? 'Fortăreață (>6 Luni)' : 'Fortress (>6 Mo)';
            safetyColor = '#10b981';
        } else if (daysRunway >= 90) {
            safetyBadge = activeLang === 'ro' ? 'Sigur (3-6 Luni)' : 'Safe (3-6 Mo)';
            safetyColor = '#10b981';
        } else if (daysRunway >= 30) {
            safetyBadge = activeLang === 'ro' ? 'Moderat (1-3 Luni)' : 'Moderate (1-3 Mo)';
            safetyColor = '#3b82f6';
        } else if (daysRunway > 0) {
            safetyBadge = activeLang === 'ro' ? 'Vulnerabil (<1 Lună)' : 'Vulnerable (<1 Mo)';
            safetyColor = '#f59e0b';
        } else {
            safetyBadge = activeLang === 'ro' ? 'Epuizat' : 'Exhausted';
            safetyColor = '#ef4444';
        }

        const runwayDisplay = daysRunway >= 999 
            ? '&infin; Zile' 
            : (daysRunway >= 60 ? `~${(daysRunway / 30.4).toFixed(1)} Luni` : `${daysRunway} Zile`);

        const sim10Days = daysRunway > 0 && daysRunway < 999 ? Math.round(daysRunway * 1.11) : daysRunway;
        const sim20Days = daysRunway > 0 && daysRunway < 999 ? Math.round(daysRunway * 1.25) : daysRunway;

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid ${safetyColor};">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Autonomie Totală Disponibilă' : 'Estimated Financial Runway'}</div>
                <div class="kpi-detail-hero-val" style="color: ${safetyColor};">${runwayDisplay}</div>
                <div class="kpi-detail-hero-sub">${activeLang === 'ro' ? `timpul de acoperire a cheltuielilor (~${daysRunway} zile de rezervă)` : `time you can sustain current spend without new income`}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Sold Total Disponibil' : 'Total Available Balance'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(totalBalRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Nivel Siguranță' : 'Safety Tier'}</div>
                    <div class="kpi-detail-mini-val" style="color: ${safetyColor}; font-size: 0.85rem;">${safetyBadge}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">💳 ${activeLang === 'ro' ? 'Sold Card (Bancă)' : 'Card Balance'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(cardBalRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">💵 ${activeLang === 'ro' ? 'Sold Cash (Portofel)' : 'Cash Balance'}</div>
                    <div class="kpi-detail-mini-val">${formatMoney(convertFromRon(cashBalRon, mainCurr), mainCurr)}</div>
                </div>
            </div>

            <div class="kpi-detail-advice-card">
                🛡️ <strong>Simulare de Optimizare a Autonomiei:</strong><br>
                • Dacă reduci cheltuielile lunare cu <strong>10%</strong>, autonomia crește la <strong>${sim10Days} zile</strong> (+${sim10Days - daysRunway} zile).<br>
                • Dacă reduci cheltuielile lunare cu <strong>20%</strong>, autonomia crește la <strong>${sim20Days} zile</strong> (+${sim20Days - daysRunway} zile).
            </div>

            <div style="background: var(--item-bg); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
                <div style="font-size: 0.80rem; font-weight: 700; margin-bottom: 6px;">💡 Recomandare Fond de Urgență:</div>
                <div style="font-size: 0.74rem; color: var(--text-color); line-height: 1.45;">
                    Specialiștii financiari recomandă menținerea unei rezerve de <strong>minim 3 până la 6 luni de cheltuieli</strong> în conturi sigure și ușor accesibile.
                </div>
            </div>
        `;
    } else if (metricKey === 'activity') {
        if (modalIconEl) modalIconEl.textContent = '🧾';
        if (modalTitleEl) modalTitleEl.textContent = activeLang === 'ro' ? 'Volum & Activitate Tranzacții' : 'Transaction Volume & Activity';

        const totTx = expenseCount + incomeCount + transferCount;
        const expShare = totTx > 0 ? ((expenseCount / totTx) * 100).toFixed(1) : 0;
        const incShare = totTx > 0 ? ((incomeCount / totTx) * 100).toFixed(1) : 0;
        const trfShare = totTx > 0 ? ((transferCount / totTx) * 100).toFixed(1) : 0;
        const cardExpenseShare = expenseCount > 0 ? ((cardExpenseCount / expenseCount) * 100).toFixed(1) : 0;
        const cashExpenseShare = expenseCount > 0 ? ((cashExpenseCount / expenseCount) * 100).toFixed(1) : 0;
        const cardIncomeShare = incomeCount > 0 ? ((cardIncomeCount / incomeCount) * 100).toFixed(1) : 0;
        const cashIncomeShare = incomeCount > 0 ? ((cashIncomeCount / incomeCount) * 100).toFixed(1) : 0;

        html += `
            <div class="kpi-detail-hero" style="border-left: 4px solid #3b82f6;">
                <div class="kpi-detail-hero-label">${activeLang === 'ro' ? 'Total Tranzacții Înregistrate' : 'Total Transactions Count'}</div>
                <div class="kpi-detail-hero-val">${totTx} <span class="b-kpi-curr">${activeLang === 'ro' ? 'tranzacții' : 'tx'}</span></div>
                <div class="kpi-detail-hero-sub">${expenseCount} ${activeLang === 'ro' ? 'plăți' : 'expenses'} • ${incomeCount} ${activeLang === 'ro' ? 'încasări' : 'income'}${transferCount > 0 ? ` • ${transferCount} ${activeLang === 'ro' ? 'transferuri' : 'transfers'}` : ''}</div>
            </div>

            <div class="kpi-detail-mini-grid">
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Frecvență Medie Zilnică' : 'Daily Frequency'}</div>
                    <div class="kpi-detail-mini-val">${(totTx / Math.max(1, daysCount)).toFixed(2)} tx/zi</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Plăți Card vs Cash' : 'Card vs Cash Ratio'}</div>
                    <div class="kpi-detail-mini-val">${cardExpenseShare}% Card / ${cashExpenseShare}% Cash</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Volum Total Plăți' : 'Total Expense Volume'}</div>
                    <div class="kpi-detail-mini-val expense-color">${formatMoney(convertFromRon(totExpenseRon, mainCurr), mainCurr)}</div>
                </div>
                <div class="kpi-detail-mini-card">
                    <div class="kpi-detail-mini-label">${activeLang === 'ro' ? 'Volum Total Încasări' : 'Total Inflow Volume'}</div>
                    <div class="kpi-detail-mini-val income-color">${formatMoney(convertFromRon(totIncomeRon, mainCurr), mainCurr)}</div>
                </div>
            </div>

            <div class="kpi-detail-section-title">
                <span>📊 ${activeLang === 'ro' ? 'Repartizare pe Tipuri de Operațiuni' : 'Operation Types Breakdown'}</span>
            </div>
            <div style="margin-bottom: 14px;">
                <div class="kpi-detail-row-item">
                    <div class="kpi-detail-row-left">
                        <div class="kpi-detail-row-icon" style="color: #ef4444;">📉</div>
                        <div class="kpi-detail-row-info">
                            <div class="kpi-detail-row-name">${activeLang === 'ro' ? 'Cheltuieli & Plăți' : 'Expenses'}</div>
                            <div class="kpi-detail-row-meta">${expenseCount} tranzacții • ${expShare}% din volum</div>
                            <div class="kpi-detail-progress-track">
                                <div class="kpi-detail-progress-bar" style="width: ${expShare}%; background: #ef4444;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="kpi-detail-row-right">
                        <div class="kpi-detail-row-amt expense-color">${formatMoney(convertFromRon(totExpenseRon, mainCurr), mainCurr)}</div>
                    </div>
                </div>

                <div class="kpi-detail-row-item">
                    <div class="kpi-detail-row-left">
                        <div class="kpi-detail-row-icon" style="color: #10b981;">📈</div>
                        <div class="kpi-detail-row-info">
                            <div class="kpi-detail-row-name">${activeLang === 'ro' ? 'Venituri & Încasări' : 'Income'}</div>
                            <div class="kpi-detail-row-meta">${incomeCount} tranzacții • ${incShare}% din volum</div>
                            <div class="kpi-detail-progress-track">
                                <div class="kpi-detail-progress-bar" style="width: ${incShare}%; background: #10b981;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="kpi-detail-row-right">
                        <div class="kpi-detail-row-amt income-color">${formatMoney(convertFromRon(totIncomeRon, mainCurr), mainCurr)}</div>
                    </div>
                </div>

                ${transferCount > 0 ? `
                <div class="kpi-detail-row-item">
                    <div class="kpi-detail-row-left">
                        <div class="kpi-detail-row-icon" style="color: #8b5cf6;">🔄</div>
                        <div class="kpi-detail-row-info">
                            <div class="kpi-detail-row-name">${activeLang === 'ro' ? 'Transferuri Interne (Card ⇄ Cash)' : 'Internal Transfers'}</div>
                            <div class="kpi-detail-row-meta">${transferCount} tranzacții • ${trfShare}% din volum</div>
                            <div class="kpi-detail-progress-track">
                                <div class="kpi-detail-progress-bar" style="width: ${trfShare}%; background: #8b5cf6;"></div>
                            </div>
                        </div>
                    </div>
                </div>` : ''}
            </div>

            <div class="kpi-detail-section-title">
                <span>💳 ${activeLang === 'ro' ? 'Plăți: Card vs Cash' : 'Expense Payment Methods'}</span>
            </div>
            <div style="margin-bottom: 12px;">
                <div class="kpi-detail-row-item">
                    <div class="kpi-detail-row-left">
                        <div class="kpi-detail-row-icon">💳</div>
                        <div class="kpi-detail-row-info">
                            <div class="kpi-detail-row-name">${activeLang === 'ro' ? 'Plăți cu Cardul (Bancă)' : 'Card Payments'}</div>
                            <div class="kpi-detail-row-meta">${cardExpenseCount} plăți • ${cardExpenseShare}% din total plăți</div>
                            <div class="kpi-detail-progress-track">
                                <div class="kpi-detail-progress-bar" style="width: ${cardExpenseShare}%; background: #3b82f6;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="kpi-detail-row-right">
                        <div class="kpi-detail-row-amt">${formatMoney(convertFromRon(cardExpenseRon, mainCurr), mainCurr)}</div>
                    </div>
                </div>

                <div class="kpi-detail-row-item">
                    <div class="kpi-detail-row-left">
                        <div class="kpi-detail-row-icon">💵</div>
                        <div class="kpi-detail-row-info">
                            <div class="kpi-detail-row-name">${activeLang === 'ro' ? 'Plăți în Numerar (Cash)' : 'Cash Payments'}</div>
                            <div class="kpi-detail-row-meta">${cashExpenseCount} plăți • ${cashExpenseShare}% din total plăți</div>
                            <div class="kpi-detail-progress-track">
                                <div class="kpi-detail-progress-bar" style="width: ${cashExpenseShare}%; background: #10b981;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="kpi-detail-row-right">
                        <div class="kpi-detail-row-amt">${formatMoney(convertFromRon(cashExpenseRon, mainCurr), mainCurr)}</div>
                    </div>
                </div>
            </div>

            ${incomeCount > 0 ? `
            <div class="kpi-detail-section-title">
                <span>💰 ${activeLang === 'ro' ? 'Încasări: Card vs Cash' : 'Income Deposit Methods'}</span>
            </div>
            <div style="margin-bottom: 6px;">
                <div class="kpi-detail-row-item">
                    <div class="kpi-detail-row-left">
                        <div class="kpi-detail-row-icon">💳</div>
                        <div class="kpi-detail-row-info">
                            <div class="kpi-detail-row-name">${activeLang === 'ro' ? 'Încasări pe Card (Cont Bancar)' : 'Card/Bank Inflow'}</div>
                            <div class="kpi-detail-row-meta">${cardIncomeCount} încasări • ${cardIncomeShare}% din venituri</div>
                            <div class="kpi-detail-progress-track">
                                <div class="kpi-detail-progress-bar" style="width: ${cardIncomeShare}%; background: #3b82f6;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="kpi-detail-row-right">
                        <div class="kpi-detail-row-amt income-color">${formatMoney(convertFromRon(cardIncomeRon, mainCurr), mainCurr)}</div>
                    </div>
                </div>

                <div class="kpi-detail-row-item">
                    <div class="kpi-detail-row-left">
                        <div class="kpi-detail-row-icon">💵</div>
                        <div class="kpi-detail-row-info">
                            <div class="kpi-detail-row-name">${activeLang === 'ro' ? 'Încasări în Numerar (Portofel Cash)' : 'Cash Inflow'}</div>
                            <div class="kpi-detail-row-meta">${cashIncomeCount} încasări • ${cashIncomeShare}% din venituri</div>
                            <div class="kpi-detail-progress-track">
                                <div class="kpi-detail-progress-bar" style="width: ${cashIncomeShare}%; background: #10b981;"></div>
                            </div>
                        </div>
                    </div>
                    <div class="kpi-detail-row-right">
                        <div class="kpi-detail-row-amt income-color">${formatMoney(convertFromRon(cashIncomeRon, mainCurr), mainCurr)}</div>
                    </div>
                </div>
            </div>` : ''}
        `;
    }

    modalBodyEl.innerHTML = html;
    openModal('modalKpiDetail');
}

let merchantChartInstance = null;
let currentMerchantPeriod = 'month';
let currentFilteredMerchantKey = null;

function openMerchantAnalyticsModal(periodKey) {
    if (periodKey) currentMerchantPeriod = periodKey;
    currentFilteredMerchantKey = null;

    // Actualizam tab-urile de perioada din modal
    document.querySelectorAll('.merchant-period-btn').forEach(btn => {
        if (btn.dataset.period === currentMerchantPeriod) {
            btn.classList.add('active');
            btn.style.background = 'var(--accent)';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '700';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-muted)';
            btn.style.fontWeight = '600';
        }
    });

    renderMerchantAnalytics();
    openModal('modalMerchantAnalytics');
}

function renderMerchantAnalytics() {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const curMonthStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    const periodTxs = appData.transactions.filter(t => {
        if (!t.date || isTxSuspended(t) || t.type !== 'expense') return false;
        if (currentMerchantPeriod === 'month') return t.date.startsWith(curMonthStr);
        if (currentMerchantPeriod === '3months') return t.date >= ninetyDaysAgoStr;
        if (currentMerchantPeriod === 'year') return t.date.startsWith(String(curYear));
        return true;
    });

    const merchantTxs = [];
    const merchantMap = {};

    periodTxs.forEach(t => {
        const merchant = detectMerchantFromTransaction(t);
        if (!merchant) return;

        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        merchantTxs.push({ tx: t, merchant, amtRon });

        if (!merchantMap[merchant.key]) {
            merchantMap[merchant.key] = {
                merchant,
                totalRon: 0,
                count: 0,
                highestRon: 0,
                highestTx: null,
                txs: []
            };
        }

        const m = merchantMap[merchant.key];
        m.totalRon += amtRon;
        m.count += 1;
        m.txs.push(t);
        if (amtRon > m.highestRon) {
            m.highestRon = amtRon;
            m.highestTx = t;
        }
    });

    const merchantList = Object.values(merchantMap).sort((a, b) => b.totalRon - a.totalRon);
    const mainCurr = getActiveCurrency();
    const lang = getLanguageForCurrency();

    let totalFoodSpendRon = 0;
    merchantList.forEach(m => totalFoodSpendRon += m.totalRon);
    const totalReceiptsCount = merchantTxs.length;

    // 1. KPI-uri
    const kpiTotalEl = document.getElementById('merchantKpiTotalSpend');
    const kpiTopStoreEl = document.getElementById('merchantKpiTopStore');
    const kpiTopShareEl = document.getElementById('merchantKpiTopShare');
    const kpiAvgTicketEl = document.getElementById('merchantKpiAvgTicket');
    const kpiAvgSubEl = document.getElementById('merchantKpiAvgSub');
    const kpiReceiptsEl = document.getElementById('merchantKpiTotalReceipts');
    const kpiFreqSubEl = document.getElementById('merchantKpiFreqSub');

    if (kpiTotalEl) {
        kpiTotalEl.textContent = formatMoney(convertFromRon(totalFoodSpendRon, mainCurr), mainCurr);
    }

    if (merchantList.length > 0) {
        const topM = merchantList[0];
        const topShare = totalFoodSpendRon > 0 ? ((topM.totalRon / totalFoodSpendRon) * 100).toFixed(1) : '0';
        if (kpiTopStoreEl) kpiTopStoreEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px;">${getMerchantLogoHtml(topM.merchant.name, 20)} <span>${escapeHtml(topM.merchant.name)}</span></span>`;
        if (kpiTopShareEl) kpiTopShareEl.textContent = `${topShare}% ${t('merchant_of_food_budget', lang)}`;
    } else {
        if (kpiTopStoreEl) kpiTopStoreEl.textContent = '-';
        if (kpiTopShareEl) kpiTopShareEl.textContent = t('merchant_no_purchases', lang);
    }

    const globalAvgTicketRon = totalReceiptsCount > 0 ? (totalFoodSpendRon / totalReceiptsCount) : 0;
    if (kpiAvgTicketEl) {
        kpiAvgTicketEl.textContent = `${formatMoney(convertFromRon(globalAvgTicketRon, mainCurr), mainCurr)}`;
    }
    if (kpiAvgSubEl) {
        kpiAvgSubEl.textContent = `${totalReceiptsCount} ${t('merchant_receipts_analyzed', lang)}`;
    }

    if (kpiReceiptsEl) {
        kpiReceiptsEl.textContent = `${totalReceiptsCount} ${t('merchant_receipts_suffix', lang)}`;
    }
    if (kpiFreqSubEl) {
        kpiFreqSubEl.textContent = merchantList.length > 0 ? `${merchantList.length} ${t('merchant_visited_suffix', lang)}` : t('merchant_kpi_freq_sub', lang);
    }

    // 2. Grafic Donut
    renderMerchantChart(merchantList, totalFoodSpendRon, mainCurr);

    // 3. Clasament Magazine
    renderMerchantRanking(merchantList, totalFoodSpendRon, mainCurr);

    // 4. Salvare Cache și Actualizare Rând Acțiune Sub Tabel
    currentFoodBasketTxsCache = merchantTxs;

    const triggerTitle = document.getElementById('foodBasketReceiptsTriggerTitle');
    const triggerCount = document.getElementById('foodBasketReceiptsTriggerCount');
    const triggerTotal = document.getElementById('foodBasketReceiptsTriggerTotal');

    const filteredForTrigger = currentFilteredMerchantKey ? merchantTxs.filter(item => item.merchant.key === currentFilteredMerchantKey) : merchantTxs;
    let filteredSpendRon = 0;
    filteredForTrigger.forEach(m => filteredSpendRon += m.amtRon);

    if (triggerTitle) {
        if (currentFilteredMerchantKey) {
            const mObj = KNOWN_MERCHANTS.find(k => k.key === currentFilteredMerchantKey) || (appData.settings?.customMerchants || []).find(k => k.name.toLowerCase().replace(/[^a-z0-9]/g, '_') === currentFilteredMerchantKey) || { name: t('placeholder_store', lang) };
            triggerTitle.textContent = `${t('food_basket_title', lang)}: ${mObj.name}`;
        } else {
            triggerTitle.textContent = t('merchant_all_receipts_trigger', lang);
        }
    }

    if (triggerCount) {
        triggerCount.textContent = `${filteredForTrigger.length} ${t('merchant_receipts_suffix', lang)} • ${t('merchant_click_to_view_all', lang)}`;
    }

    if (triggerTotal) {
        triggerTotal.textContent = formatMoney(convertFromRon(filteredSpendRon, mainCurr), mainCurr);
    }
}

function renderMerchantChart(merchantList, totalFoodSpendRon, mainCurr) {
    const canvas = document.getElementById('merchantComparisonChart');
    const countEl = document.getElementById('merchantChartStoreCount');
    const chartWrap = document.getElementById('merchantComparisonChartWrap') || (canvas ? canvas.parentElement : null);
    const lang = getLanguageForCurrency();
    if (!canvas) return;

    if (countEl) {
        countEl.textContent = `${merchantList.length} ${t('merchant_stores_suffix', lang)}`;
    }

    const ctx = canvas.getContext('2d');
    if (merchantChartInstance) {
        try { merchantChartInstance.destroy(); } catch (e) {}
        merchantChartInstance = null;
    }

    if (merchantList.length === 0) {
        if (chartWrap) chartWrap.style.height = '140px';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Calculează dinamic înălțimea pentru a încăpea toate magazinele pe o singură coloană
    if (chartWrap) {
        const calculatedHeight = Math.max(200, merchantList.length * 28 + 24);
        chartWrap.style.height = `${calculatedHeight}px`;
    }

    const labels = merchantList.map(m => {
        const pct = totalFoodSpendRon > 0 ? ((m.totalRon / totalFoodSpendRon) * 100).toFixed(1) : '0';
        return `${m.merchant.name} (${pct}%)`;
    });
    const dataVals = merchantList.map(m => convertFromRon(m.totalRon, mainCurr));
    const bgColors = merchantList.map(m => m.merchant.color || '#3b82f6');

    merchantChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataVals,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: document.body.classList.contains('light-theme') ? '#ffffff' : '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    align: 'center',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 8,
                        font: { size: 10.5, weight: '600' },
                        color: document.body.classList.contains('light-theme') ? '#0f172a' : '#f8fafc'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                            const mObj = merchantList[context.dataIndex];
                            const name = mObj ? mObj.merchant.name : context.label;
                            return ` ${name}: ${formatMoney(val, mainCurr)} (${pct}%)`;
                        }
                    }
                }
            },
            onClick: (evt, elements) => {
                if (elements && elements.length > 0) {
                    const idx = elements[0].index;
                    const clickedMerchant = merchantList[idx];
                    if (clickedMerchant) {
                        currentFilteredMerchantKey = clickedMerchant.merchant.key;
                        renderMerchantAnalytics();
                    }
                }
            }
        }
    });
}

function renderMerchantRanking(merchantList, totalFoodSpendRon, mainCurr) {
    const container = document.getElementById('merchantRankingContainer');
    const lang = getLanguageForCurrency();
    if (!container) return;

    container.innerHTML = '';

    if (merchantList.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.80rem;">${t('merchant_no_purchases', lang)}</div>`;
        return;
    }

    merchantList.forEach(item => {
        const m = item.merchant;
        const totalDisp = formatMoney(convertFromRon(item.totalRon, mainCurr), mainCurr);
        const sharePct = totalFoodSpendRon > 0 ? ((item.totalRon / totalFoodSpendRon) * 100).toFixed(1) : '0';
        const avgTicketRon = item.count > 0 ? (item.totalRon / item.count) : 0;
        const avgDisp = formatMoney(convertFromRon(avgTicketRon, mainCurr), mainCurr);
        const maxDisp = formatMoney(convertFromRon(item.highestRon, mainCurr), mainCurr);

        const card = document.createElement('div');
        card.className = 'merchant-rank-card';
        if (currentFilteredMerchantKey === m.key) {
            card.style.borderColor = 'var(--accent)';
            card.style.background = 'rgba(37, 99, 235, 0.08)';
        }

        card.innerHTML = `
            <div class="merchant-rank-header">
                <div class="merchant-rank-title">
                    <div style="width:30px; height:30px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        ${getMerchantLogoHtml(m.name, 26)}
                    </div>
                    <span>${escapeHtml(m.name)}</span>
                </div>
                <div class="merchant-rank-amount">
                    ${totalDisp}
                    <span style="font-size: 0.70rem; color: var(--accent); font-weight: 700; margin-left: 4px;">(${sharePct}%)</span>
                </div>
            </div>
            <div class="merchant-progress-track">
                <div class="merchant-progress-bar" style="width: ${sharePct}%; background-color: ${m.color || 'var(--accent)'};"></div>
            </div>
            <div class="merchant-rank-meta">
                <span>🧾 ${item.count} ${t('merchant_receipts_suffix', lang)} • ${t('stat_avg_ticket', lang)}: <strong>${avgDisp}</strong></span>
                <span>${t('stat_peak_exp', lang)}: <strong>${maxDisp}</strong></span>
            </div>
        `;

        card.addEventListener('click', () => {
            if (currentFilteredMerchantKey === m.key) {
                currentFilteredMerchantKey = null;
            } else {
                currentFilteredMerchantKey = m.key;
            }
            renderMerchantAnalytics();
        });

        container.appendChild(card);
    });
}

let currentFoodBasketTxsCache = [];

function openFoodBasketReceiptsModal() {
    const inputSearch = document.getElementById('inputSearchFoodReceipts');
    if (inputSearch) inputSearch.value = '';
    renderFoodBasketReceiptsModal();
    openModal('modalFoodBasketReceipts');
}

function renderFoodBasketReceiptsModal() {
    const listEl = document.getElementById('foodBasketReceiptsFullList');
    const totalAmountEl = document.getElementById('foodBasketFullTotalAmount');
    const countBadgeEl = document.getElementById('foodBasketFullReceiptsCountBadge');
    const subInfoEl = document.getElementById('foodBasketFullSubInfo');
    const periodLabelEl = document.getElementById('foodBasketReceiptsPeriodLabel');
    const btnClearFilter = document.getElementById('btnClearFoodFilter');
    const inputSearch = document.getElementById('inputSearchFoodReceipts');

    if (!listEl) return;

    const mainCurr = getActiveCurrency();
    const lang = getLanguageForCurrency();
    const query = inputSearch ? normalizeDiacritics(inputSearch.value.trim()) : '';

    let periodName = t('stat_pill_month', lang);
    if (currentMerchantPeriod === '3months') periodName = t('stat_pill_3months', lang);
    else if (currentMerchantPeriod === 'year') periodName = t('stat_pill_year', lang);
    else if (currentMerchantPeriod === 'all') periodName = t('stat_pill_all', lang);

    if (periodLabelEl) {
        periodLabelEl.textContent = `${t('export_lbl_period', lang)}: ${periodName}`;
    }

    // Filtrare după magazin dacă este selectat
    let filtered = currentFilteredMerchantKey 
        ? currentFoodBasketTxsCache.filter(item => item.merchant.key === currentFilteredMerchantKey)
        : currentFoodBasketTxsCache;

    if (btnClearFilter) {
        if (currentFilteredMerchantKey) {
            const mObj = KNOWN_MERCHANTS.find(k => k.key === currentFilteredMerchantKey) || (appData.settings?.customMerchants || []).find(k => k.name.toLowerCase().replace(/[^a-z0-9]/g, '_') === currentFilteredMerchantKey) || { name: t('placeholder_store', lang) };
            btnClearFilter.style.display = 'inline-block';
            btnClearFilter.textContent = `✕ ${t('food_basket_show_all', lang)} (${t('food_basket_filtered', lang)}: ${mObj.name})`;
            btnClearFilter.onclick = () => {
                currentFilteredMerchantKey = null;
                renderMerchantAnalytics();
                renderFoodBasketReceiptsModal();
            };
        } else {
            btnClearFilter.style.display = 'none';
        }
    }

    // Filtrare după text căutat
    if (query) {
        filtered = filtered.filter(item => {
            const tx = item.tx;
            const m = item.merchant;
            const desc = normalizeDiacritics(tx.description || '');
            const mName = normalizeDiacritics(m.name || '');
            const cat = appData.categories.find(c => c.id === tx.categoryId);
            const catName = normalizeDiacritics(cat ? cat.name : '');
            return desc.includes(query) || mName.includes(query) || catName.includes(query);
        });
    }

    // Calcul Total Bonuri Afișate
    let sumRon = 0;
    filtered.forEach(item => {
        sumRon += item.amtRon;
    });

    if (totalAmountEl) {
        totalAmountEl.textContent = formatMoney(convertFromRon(sumRon, mainCurr), mainCurr);
    }

    if (countBadgeEl) {
        countBadgeEl.textContent = `${filtered.length} ${t('merchant_receipts_suffix', lang)}`;
    }

    if (subInfoEl) {
        let storeInfo = '';
        if (currentFilteredMerchantKey) {
            const mObj = KNOWN_MERCHANTS.find(k => k.key === currentFilteredMerchantKey) || (appData.settings?.customMerchants || []).find(k => k.name.toLowerCase().replace(/[^a-z0-9]/g, '_') === currentFilteredMerchantKey) || { name: t('placeholder_store', lang) };
            storeInfo = ` • ${t('placeholder_store', lang)}: ${mObj.name}`;
        }
        subInfoEl.textContent = `${periodName}${storeInfo}`;
    }

    listEl.innerHTML = '';

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:28px 12px; color:var(--text-muted); font-size:0.85rem;">${t('food_basket_empty', lang)}</div>`;
        return;
    }

    // Sortare descrescătoare după dată
    const sorted = [...filtered].sort((a, b) => new Date(b.tx.date) - new Date(a.tx.date) || (b.tx.createdAt || 0) - (a.tx.createdAt || 0));

    sorted.forEach(item => {
        const tx = item.tx;
        const m = item.merchant;
        const cat = appData.categories.find(c => c.id === tx.categoryId);
        const amtDisp = formatMoney(convertFromRon(item.amtRon, mainCurr), mainCurr);
        const descText = tx.description ? tx.description : m.name;
        const isSuspended = isTxSuspended(tx);
        const payMethod = tx.paymentMethod === 'cash' ? `💵 ${t('pay_method_cash', lang)}` : `💳 ${t('pay_method_card', lang)}`;
        const visualIcon = getReceiptVisualIcon(tx, m);
        const isVisualEmoji = typeof visualIcon === 'string' && !visualIcon.startsWith('<span');

        const row = document.createElement('div');
        row.className = 'tx-item' + (isSuspended ? ' tx-suspended' : '');
        row.style.padding = '10px 12px';
        row.style.marginBottom = '8px';
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '4px';

        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                    <div style="width:36px; height:36px; border-radius:9px; background:${m.color ? m.color + '18' : 'rgba(59, 130, 246, 0.12)'}; border: 1px solid ${m.color ? m.color + '44' : 'rgba(59, 130, 246, 0.25)'}; display:flex; align-items:center; justify-content:center; font-size:${isVisualEmoji ? '1.35rem' : '1rem'}; flex-shrink:0;">
                        ${visualIcon}
                    </div>
                    <div style="min-width:0;">
                        <div style="font-weight:700; font-size:0.88rem; color:var(--text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${escapeHtml(descText)}
                        </div>
                        <div style="font-size:0.70rem; color:var(--text-muted); display:flex; align-items:center; gap:6px; margin-top:2px;">
                            <span>📅 ${formatDateDisplay(tx.date)}</span>
                            <span>•</span>
                            <span style="display:inline-flex; align-items:center; gap:4px; font-weight:600; color:${m.color || 'var(--accent)'};">
                                ${getMerchantLogoHtml(m.name, 14)}
                                <span>${escapeHtml(m.name)}</span>
                            </span>
                            <span>•</span>
                            <span>${payMethod}</span>
                        </div>
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                    <span class="tx-amount expense-color" style="font-weight:800; font-size:0.95rem; letter-spacing:-0.3px;">-${amtDisp}</span>
                    ${cat ? `<div style="font-size:0.68rem; color:${cat.color || 'var(--text-dim)'}; margin-top:1px;">${escapeHtml(cat.name)}</div>` : ''}
                </div>
            </div>
        `;
        listEl.appendChild(row);
    });
}

// ==========================================
// BUSINESS INTELLIGENCE: ANALIZĂ FACTURI & UTILITĂȚI (MULTI-LINE TREND & CLASSIFICATION)
// ==========================================
const BILL_TYPES = [
    {
        key: 'electricity',
        name: '⚡ Curent / Energie',
        nameEn: '⚡ Electricity & Energy',
        color: '#f59e0b',
        icon: '⚡',
        keywords: ['curent', 'electric', 'energie', 'enel', 'e.on energie', 'hidroelectrica', 'electrica', 'premier energy', 'cezon', 'pfe', 'lumina', 'power']
    },
    {
        key: 'gas',
        name: '🔥 Gaze Naturale',
        nameEn: '🔥 Natural Gas',
        color: '#ea580c',
        icon: '🔥',
        keywords: ['gaz', 'gaze', 'engie', 'e.on gaz', 'distrigaz', 'nova power', 'gaz metan', 'eon gaz']
    },
    {
        key: 'water_waste',
        name: '💧 Apă & Salubritate',
        nameEn: '💧 Water & Waste',
        color: '#06b6d4',
        icon: '💧',
        keywords: ['apa', 'apă', 'apa nova', 'aquatim', 'raja', 'salubritate', 'salubrizare', 'gunoi', 'retim', 'supercom', 'rosal', 'brantner', 'polaris', 'rer', 'canalizare', 'apaterm', 'termoenergetica', 'radet']
    },
    {
        key: 'internet_tv',
        name: '🌐 Internet & Televiziune',
        nameEn: '🌐 Internet & TV',
        color: '#6366f1',
        icon: '🌐',
        keywords: ['internet', 'tv', 'digi', 'rcs', 'rds', 'rcs-rds', 'vodafone fix', 'upc', 'orange communications', 'fibra', 'cablu', 'akto']
    },
    {
        key: 'phone',
        name: '📱 Telefonie Mobilă',
        nameEn: '📱 Mobile Phone',
        color: '#ec4899',
        icon: '📱',
        keywords: ['telefon', 'telefonie', 'orange', 'vodafone', 'telekom', 'yoxo', 'digi mobil', 'reincarcare', 'abonament telefon']
    },
    {
        key: 'maintenance',
        name: '🏢 Întreținere & Bloc',
        nameEn: '🏢 Building Maintenance',
        color: '#10b981',
        icon: '🏢',
        keywords: ['intretinere', 'întreținere', 'asociatie', 'asociație', 'fond rulment', 'fond reparatii', 'cote intretinere', 'cheltuieli bloc', 'avizier', 'administrator']
    },
    {
        key: 'taxes_loans',
        name: '🏦 Rate & Taxe Utilități',
        nameEn: '🏦 Rates & Utility Taxes',
        color: '#8b5cf6',
        icon: '🏦',
        keywords: ['impozit', 'taxa', 'taxe', 'rata', 'rate', 'credit', 'asigurare', 'pad', 'casco', 'rca', 'banca', 'anp', 'ghiseul.ro', 'anaf']
    },
    {
        key: 'other_bills',
        name: '📦 Alte Facturi / Servicii',
        nameEn: '📦 Other Bills / Services',
        color: '#64748b',
        icon: '📦',
        keywords: ['factura', 'factură', 'utilitati', 'utilități', 'abonament', 'servicii']
    }
];

const BILL_OPTIMIZATION_SOLUTIONS = {
    electricity: {
        icon: '💡',
        title: 'Energie Electrică (Curent)',
        solutions: [
            'Înlocuirea becurilor convenționale cu <strong>LED-uri economice</strong> reduce consumul de iluminat cu până la <strong>80%</strong>.',
            'Oprirea aparatelor din modul <strong>Standby</strong> (TV, laptopuri, electrocasnice mici) economisește <strong>5-10%</strong> din factură.',
            'Folosirea mașinii de spălat rufe și vase pe programe <strong>Eco (30°-40°C)</strong> scade consumul electric cu până la <strong>40%</strong> per spălare.'
        ]
    },
    gas_heating: {
        icon: '🔥',
        title: 'Gaze Naturale & Încălzire',
        solutions: [
            'Ajustarea termostatului cu <strong>1°C mai puțin</strong> (ex: de la 22°C la 21°C) scade consumul de gaz cu aprox. <strong>6-7%</strong>.',
            'Folosirea unui <strong>cronotermostat programabil</strong> (18-19°C noaptea / când ești plecat) aduce economii de până la <strong>20%</strong>.',
            'Etanșarea ferestrelor și aerisirea scurtă (5-10 min) cu geamul larg deschis previn pierderile masive de căldură.'
        ]
    },
    water_sewerage: {
        icon: '💧',
        title: 'Apă & Canalizare',
        solutions: [
            'Montarea de <strong>aeratoare / perlatoare economice</strong> la robinete reduce debitul cu <strong>35-40%</strong> păstrând aceeași presiune.',
            'Verificarea periodică a rezervorului WC: o scurgere continuă nevăzută poate risipi între <strong>30 și 50 litri/zi</strong>.',
            'Optimizarea duratei dușurilor și închiderea apei în timpul periajului dentar sau săpunirii.'
        ]
    },
    internet_tv: {
        icon: '🌐',
        title: 'Internet & Televiziune',
        solutions: [
            'Renegocierea contractului la final de perioadă sau comasarea într-un <strong>pachet unic (Internet + TV + Mobil)</strong> pentru reduceri de <strong>20-30%</strong>.',
            'Eliminarea extra-opțiunilor sau pachetelor de canale TV neutilizate și a decodoarelor suplimentare inactive.'
        ]
    },
    phone: {
        icon: '📱',
        title: 'Telefonie Mobilă',
        solutions: [
            'Trecerea la abonamente digitale flexibile fără perioadă contractuală sau oferte speciale de fidelizare.',
            'Dezactivarea serviciilor automate cu taxare recurentă prin SMS sau roaming nesolicitat.'
        ]
    },
    maintenance: {
        icon: '🏢',
        title: 'Întreținere Bloc & Asociație',
        solutions: [
            'Transmiterea lunară riguroasă a indexului la apometre pentru a evita recalculările și diferențele comune de branșament.',
            'Verificarea lunară a listei de plată afișate la avizier pentru a identifica eventuale cheltuieli comune anormale.'
        ]
    },
    taxes_loans: {
        icon: '🏦',
        title: 'Rate, Impozite & Asigurări',
        solutions: [
            'Achitarea impozitelor locale până la 31 martie pentru a beneficia de <strong>bonificația de 10%</strong> acordată de primării.',
            'Compararea ofertelor RCA/PAD pe agregatoare online înainte de reînnoire pentru cel mai bun tarif.'
        ]
    },
    other_bills: {
        icon: '📦',
        title: 'Alte Facturi & Abonamente',
        solutions: [
            'Revizuirea periodică a abonamentelor lunare recurente (streaming video/audio, cloud, aplicații) și anularea celor nefolosite.'
        ]
    }
};

function getCleanBillTypeName(bt) {
    if (!bt) return '';
    const raw = bt.name || '';
    return raw.replace(/^[^\w\s\u00C0-\u024F\u1E00-\u1EFF]+/, '').trim();
}

function matchKeywordWordBoundary(text, keyword) {
    if (!text || !keyword) return false;
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(?:^|[\\s,;:.\\-_/()\\[\\]!?"\'])' + escaped + '(?:$|[\\s,;:.\\-_/()\\[\\]!?"\'])', 'i');
    return regex.test(text);
}

function isBillCategory(catId) {
    if (!catId) return false;
    const cat = appData.categories.find(c => c.id === catId);
    if (!cat) {
        return catId === 'cat-2';
    }
    const catName = normalizeDiacritics(cat.name || '').toLowerCase();
    // Excludem explicit chiria/locuința dacă există categorie separată
    if (catName.includes('chirie') || catName.includes('locuinta')) return false;
    if (catId === 'cat-2') return true;
    return catName.includes('factur') || catName.includes('utilitat') || catName.includes('intretinere') || catName.includes('abonament');
}

function classifyBillTransaction(tx) {
    if (!tx || tx.type !== 'expense' || isTxSuspended(tx)) return null;

    // Se iau în considerare exclusiv tranzacțiile din categoria de Facturi & Utilități
    if (!isBillCategory(tx.categoryId)) return null;

    const cat = appData.categories.find(c => c.id === tx.categoryId);
    const catName = cat ? normalizeDiacritics(cat.name || '').toLowerCase() : '';
    const desc = normalizeDiacritics(tx.description || '').toLowerCase();
    const mc = getTransactionMerchantAndComment(tx);
    const merchantName = normalizeDiacritics(mc.merchant || '').toLowerCase();
    const comment = normalizeDiacritics(mc.comment || '').toLowerCase();
    const combined = `${catName} ${desc} ${merchantName} ${comment}`;

    // Căutare în fiecare tip de factură specific folosind word-boundary strict
    for (const bType of BILL_TYPES) {
        if (bType.key === 'other_bills') continue;
        for (const kw of bType.keywords) {
            const normKw = normalizeDiacritics(kw);
            if (matchKeywordWordBoundary(combined, normKw)) {
                return bType;
            }
        }
    }

    return BILL_TYPES.find(b => b.key === 'other_bills') || BILL_TYPES[BILL_TYPES.length - 1];
}

function isBillTransaction(tx) {
    return classifyBillTransaction(tx) !== null;
}

let billsTrendChartInstance = null;
let currentBillsPeriod = 'year';
let currentFilteredBillTypeKey = null;

function openBillsAnalyticsModal(periodKey) {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const curMonthStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    // Preferăm 'year' sau perioada cerută dacă aceasta are date
    let targetPeriod = periodKey || 'year';

    // Verificăm dacă perioada cerută are facturi
    const hasBillsForPeriod = (p) => {
        return appData.transactions.some(t => {
            if (!t.date || isTxSuspended(t) || t.type !== 'expense') return false;
            if (!classifyBillTransaction(t)) return false;
            if (p === 'month') return t.date.startsWith(curMonthStr);
            if (p === '3months') return t.date >= ninetyDaysAgoStr;
            if (p === 'year') return t.date.startsWith(String(curYear));
            return true;
        });
    };

    if (!hasBillsForPeriod(targetPeriod)) {
        if (hasBillsForPeriod('year')) {
            targetPeriod = 'year';
        } else if (hasBillsForPeriod('3months')) {
            targetPeriod = '3months';
        } else if (hasBillsForPeriod('all')) {
            targetPeriod = 'all';
        }
    }

    currentBillsPeriod = targetPeriod;
    currentFilteredBillTypeKey = null;

    // Actualizare stări butoane perioadă
    document.querySelectorAll('.bills-period-btn').forEach(btn => {
        if (btn.dataset.period === currentBillsPeriod) {
            btn.classList.add('active');
            btn.style.background = 'var(--accent)';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '700';
        } else {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-muted)';
            btn.style.fontWeight = '600';
        }
    });

    renderBillsAnalytics();
    openModal('modalBillsAnalytics');
}

function renderBillsAnalytics() {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const curMonthStr = `${curYear}-${String(curMonth).padStart(2, '0')}`;
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    const yearSelect = document.getElementById('statsYearSelect');
    const selectedYear = yearSelect && yearSelect.value ? parseInt(yearSelect.value, 10) : curYear;
    const yearPrefix = String(selectedYear);

    // 1. Tranzacțiile din perioada selectată pentru statistici globale
    const periodAllTxs = appData.transactions.filter(t => {
        if (!t.date || isTxSuspended(t) || t.type !== 'expense') return false;
        if (currentBillsPeriod === 'month') return t.date.startsWith(curMonthStr);
        if (currentBillsPeriod === '3months') return t.date >= ninetyDaysAgoStr;
        if (currentBillsPeriod === 'year') return t.date.startsWith(yearPrefix);
        return true;
    });

    let totalPeriodExpensesRon = 0;
    periodAllTxs.forEach(t => {
        totalPeriodExpensesRon += parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
    });

    // 2. Extragere și clasificare tranzacții facturi
    const billsTxs = [];
    const billTypeMap = {};

    periodAllTxs.forEach(t => {
        const bType = classifyBillTransaction(t);
        if (!bType) return;

        const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
        billsTxs.push({ tx: t, billType: bType, amtRon });

        if (!billTypeMap[bType.key]) {
            billTypeMap[bType.key] = {
                billType: bType,
                totalRon: 0,
                count: 0,
                highestRon: 0,
                highestTx: null,
                txs: []
            };
        }

        const group = billTypeMap[bType.key];
        group.totalRon += amtRon;
        group.count += 1;
        group.txs.push(t);
        if (amtRon > group.highestRon) {
            group.highestRon = amtRon;
            group.highestTx = t;
        }
    });

    const billTypeList = Object.values(billTypeMap).sort((a, b) => b.totalRon - a.totalRon);
    const mainCurr = getActiveCurrency();
    const lang = getLanguageForCurrency();

    let totalBillsSpendRon = 0;
    let peakBillTx = null;
    let peakBillAmtRon = 0;

    billsTxs.forEach(item => {
        totalBillsSpendRon += item.amtRon;
        if (item.amtRon > peakBillAmtRon) {
            peakBillAmtRon = item.amtRon;
            peakBillTx = item.tx;
        }
    });

    // Calcule perioadă pentru media lunară
    let monthsCount = 1;
    if (currentBillsPeriod === 'month') {
        monthsCount = 1;
    } else if (currentBillsPeriod === '3months') {
        monthsCount = 3;
    } else if (currentBillsPeriod === 'year') {
        monthsCount = Math.max(1, curMonth);
    } else {
        const validDates = billsTxs.map(b => b.tx.date).filter(Boolean).sort();
        if (validDates.length > 0) {
            const d1 = new Date(validDates[0]);
            const d2 = new Date(validDates[validDates.length - 1]);
            monthsCount = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24 * 30.4)));
        } else {
            monthsCount = 12;
        }
    }

    const monthlyAvgRon = totalBillsSpendRon / monthsCount;
    const budgetShare = totalPeriodExpensesRon > 0 ? ((totalBillsSpendRon / totalPeriodExpensesRon) * 100).toFixed(1) : '0.0';

    // 1. Populare cele 4 mini KPI-uri
    const kpiTotalEl = document.getElementById('billsKpiTotalSpend');
    const kpiTotalSubEl = document.getElementById('billsKpiTotalSub');
    const kpiAvgEl = document.getElementById('billsKpiMonthlyAvg');
    const kpiAvgSubEl = document.getElementById('billsKpiAvgSub');
    const kpiPeakEl = document.getElementById('billsKpiPeakBill');
    const kpiPeakSubEl = document.getElementById('billsKpiPeakSub');
    const kpiShareEl = document.getElementById('billsKpiBudgetShare');
    const kpiShareSubEl = document.getElementById('billsKpiShareSub');

    if (kpiTotalEl) {
        kpiTotalEl.textContent = formatMoney(convertFromRon(totalBillsSpendRon, mainCurr), mainCurr);
    }
    if (kpiTotalSubEl) {
        kpiTotalSubEl.textContent = `${billsTxs.length} ${lang === 'ro' ? 'plăți înregistrate' : 'payments'}`;
    }

    if (kpiAvgEl) {
        kpiAvgEl.textContent = `${formatMoney(convertFromRon(monthlyAvgRon, mainCurr), mainCurr)}/lună`;
    }
    if (kpiAvgSubEl) {
        kpiAvgSubEl.textContent = `${lang === 'ro' ? 'calculat pe' : 'over'} ~${monthsCount} ${lang === 'ro' ? 'luni' : 'months'}`;
    }

    if (kpiPeakEl && kpiPeakSubEl) {
        if (peakBillTx) {
            const peakBType = classifyBillTransaction(peakBillTx) || { icon: '⚡', name: 'Factură' };
            const pMc = getTransactionMerchantAndComment(peakBillTx);
            const pName = pMc.merchant || peakBillTx.description || getCleanBillTypeName(peakBType);
            kpiPeakEl.innerHTML = formatMoney(convertFromRon(peakBillAmtRon, mainCurr), mainCurr);
            kpiPeakSubEl.textContent = `${peakBType.icon} ${escapeHtml(pName)} • ${formatDateDisplay(peakBillTx.date)}`;
        } else {
            kpiPeakEl.textContent = '-';
            kpiPeakSubEl.textContent = lang === 'ro' ? 'Nicio factură' : 'No bills';
        }
    }

    if (kpiShareEl) {
        kpiShareEl.textContent = `${budgetShare}%`;
    }
    if (kpiShareSubEl) {
        kpiShareSubEl.textContent = `${lang === 'ro' ? 'din total' : 'of total'} ${formatMoney(convertFromRon(totalPeriodExpensesRon, mainCurr), mainCurr)}`;
    }

    // 2. Randare Grafic Multi-Linie Trend & Carduri Pătrate
    renderBillsTrendChart(mainCurr, lang, selectedYear);

    // 3. Diagnostic & Evaluare Creșteri / Anomalii (afișat doar dacă e cazul)
    renderBillsDiagnostic(billTypeList, totalBillsSpendRon, mainCurr, lang, selectedYear);

    // 4. Randare Listă Tranzacții Facturi Filtrate (filtrată la click pe card)
    renderBillsTransactionsList(billsTxs, mainCurr, lang);
}

function renderBillsTrendChart(mainCurr, lang, selectedYear) {
    const canvas = document.getElementById('billsTrendChart');
    const legendContainer = document.getElementById('billsChartLegend');
    const activeTypesCountEl = document.getElementById('billsChartActiveTypesCount');
    if (!canvas) return;

    const curYear = selectedYear || new Date().getFullYear();
    const monthNames = I18N_DICTIONARY[lang]?.monthsShort || I18N_DICTIONARY['ro'].monthsShort;

    // Matrice [tip_factura][luna 0..11] - inițializată cu null pentru a uni punctele direct fără cădere la 0
    const monthlyTypeSumsRon = {};
    BILL_TYPES.forEach(bt => {
        monthlyTypeSumsRon[bt.key] = new Array(12).fill(null);
    });

    appData.transactions.forEach(t => {
        if (!t.date || isTxSuspended(t) || t.type !== 'expense') return;
        const [y, m] = t.date.split('-').map(Number);
        if (y === curYear && m >= 1 && m <= 12) {
            const bType = classifyBillTransaction(t);
            if (bType && monthlyTypeSumsRon[bType.key]) {
                const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                monthlyTypeSumsRon[bType.key][m - 1] = (monthlyTypeSumsRon[bType.key][m - 1] || 0) + amtRon;
            }
        }
    });

    // Identificare tipuri care au cel puțin o plată în anul selectat
    const activeDatasets = [];
    BILL_TYPES.forEach(bt => {
        const arrRon = monthlyTypeSumsRon[bt.key];
        const hasData = arrRon.some(v => v !== null && v > 0);
        if (hasData) {
            const totalSumRon = arrRon.reduce((acc, v) => acc + (v || 0), 0);
            const cleanName = getCleanBillTypeName(bt);
            const arrDisp = arrRon.map(v => v !== null ? convertFromRon(v, mainCurr) : null);
            activeDatasets.push({
                label: cleanName,
                billTypeObj: bt,
                totalSumRon: totalSumRon,
                data: arrDisp,
                borderColor: bt.color,
                backgroundColor: bt.color + '22',
                borderWidth: 3,
                pointBackgroundColor: bt.color,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHitRadius: 25,
                fill: false,
                tension: 0.25,
                spanGaps: true
            });
        }
    });

    if (activeTypesCountEl) {
        activeTypesCountEl.textContent = `${activeDatasets.length} ${lang === 'ro' ? 'tipuri active' : 'active types'}`;
    }

    if (legendContainer) {
        legendContainer.innerHTML = '';
        legendContainer.style.display = 'grid';
        legendContainer.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
        legendContainer.style.gap = '6px';
        legendContainer.style.marginTop = '10px';
        legendContainer.style.width = '100%';
        legendContainer.style.boxSizing = 'border-box';

        activeDatasets.forEach(ds => {
            const bt = ds.billTypeObj;
            const isSelected = currentFilteredBillTypeKey === bt.key;
            const cleanName = getCleanBillTypeName(bt);
            const sumRon = ds.totalSumRon || 0;
            const sumDisp = sumRon > 0 ? formatMoney(convertFromRon(sumRon, mainCurr), mainCurr) : '';

            const card = document.createElement('div');
            card.className = `bills-legend-square-card ${isSelected ? 'active' : ''}`;
            card.style.background = isSelected ? `${bt.color}25` : 'var(--card-bg)';
            card.style.border = isSelected ? `2px solid ${bt.color}` : `1px solid ${bt.color}45`;
            card.style.borderRadius = '10px';
            card.style.padding = '8px 3px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.justifyContent = 'center';
            card.style.textAlign = 'center';
            card.style.cursor = 'pointer';
            card.style.transition = 'all 0.18s ease';
            card.style.minHeight = '66px';
            card.style.minWidth = '0';
            card.style.width = '100%';
            card.style.boxSizing = 'border-box';
            card.style.overflow = 'hidden';
            card.style.boxShadow = isSelected ? `0 2px 8px ${bt.color}35` : 'none';

            card.innerHTML = `
                <div style="font-size: 1.30rem; line-height: 1; margin-bottom: 2px;">
                    ${bt.icon}
                </div>
                <div style="font-size: 0.68rem; font-weight: 700; color: var(--text-color); line-height: 1.15; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-word;">
                    ${escapeHtml(cleanName)}
                </div>
                ${sumDisp ? `<div style="font-size: 0.66rem; font-weight: 800; color: ${bt.color}; margin-top: 2px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sumDisp}</div>` : ''}
            `;

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentFilteredBillTypeKey === bt.key) {
                    currentFilteredBillTypeKey = null;
                } else {
                    currentFilteredBillTypeKey = bt.key;
                }
                renderBillsAnalytics();
                setTimeout(() => {
                    const listSection = document.getElementById('billsTransactionsList');
                    if (listSection) {
                        listSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 50);
            });

            legendContainer.appendChild(card);
        });
    }

    const ctx = canvas.getContext('2d');
    if (billsTrendChartInstance) {
        try { billsTrendChartInstance.destroy(); } catch (e) {}
        billsTrendChartInstance = null;
    }

    billsTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthNames,
            datasets: activeDatasets.length > 0 ? activeDatasets : [{
                label: lang === 'ro' ? 'Facturi' : 'Bills',
                data: new Array(12).fill(null),
                borderColor: '#64748b',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            events: ['click'], // Doar la click/tap explicit pe un punct din grafic
            interaction: {
                mode: 'point',
                intersect: true
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: 'var(--text-muted)', font: { size: 10 } }
                },
                y: {
                    beginAtZero: false,
                    grid: { color: 'rgba(148, 163, 184, 0.12)' },
                    ticks: {
                        color: 'var(--text-muted)',
                        font: { size: 10 },
                        callback: (v) => (v !== null && v !== undefined) ? v + ' ' + mainCurr : ''
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    events: ['click'],
                    mode: 'point',
                    intersect: true,
                    callbacks: {
                        label: (ctx) => {
                            if (ctx.raw === null || ctx.raw === undefined) return '';
                            return ` ${ctx.dataset.label}: ${formatMoney(ctx.raw, mainCurr)}`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });
}

function renderBillsDiagnostic(billTypeList, totalBillsSpendRon, mainCurr, lang, selectedYear) {
    const container = document.getElementById('billsDiagnosticList');
    const badgeEl = document.getElementById('billsDiagnosticBadge');
    if (!container) return;
    container.innerHTML = '';

    if (billTypeList.length === 0) {
        if (badgeEl) badgeEl.textContent = '';
        container.innerHTML = `<div style="text-align:center; padding:12px; color:var(--text-muted); font-size:0.75rem;">Nu există date suficiente pentru evaluare în această perioadă.</div>`;
        return;
    }

    const alerts = [];

    billTypeList.forEach(item => {
        const bt = item.billType;
        const cleanBtName = getCleanBillTypeName(bt);
        const monthlyMap = {};
        appData.transactions.forEach(t => {
            if (!t.date || isTxSuspended(t) || t.type !== 'expense') return;
            const bType = classifyBillTransaction(t);
            if (bType && bType.key === bt.key) {
                const ym = t.date.substring(0, 7);
                const amtRon = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                monthlyMap[ym] = (monthlyMap[ym] || 0) + amtRon;
            }
        });

        const sortedMonths = Object.keys(monthlyMap).sort();
        const sharePct = totalBillsSpendRon > 0 ? ((item.totalRon / totalBillsSpendRon) * 100) : 0;

        if (sortedMonths.length >= 2) {
            const latestM = sortedMonths[sortedMonths.length - 1];
            const prevM = sortedMonths[sortedMonths.length - 2];
            const latestAmt = monthlyMap[latestM];
            const prevAmt = monthlyMap[prevM];
            const diffRon = latestAmt - prevAmt;
            const diffPct = prevAmt > 0 ? ((diffRon / prevAmt) * 100) : 0;

            // Detectăm creștere semnificativă (ex: >= 15% și cel puțin 20 RON)
            if (diffPct >= 15 && diffRon >= 20) {
                const diffDisp = formatMoney(convertFromRon(diffRon, mainCurr), mainCurr);
                const latestDisp = formatMoney(convertFromRon(latestAmt, mainCurr), mainCurr);
                const prevDisp = formatMoney(convertFromRon(prevAmt, mainCurr), mainCurr);

                const optSolution = BILL_OPTIMIZATION_SOLUTIONS[bt.key] || BILL_OPTIMIZATION_SOLUTIONS['other_bills'];
                const targetedTip = optSolution && optSolution.solutions && optSolution.solutions[0] ? optSolution.solutions[0] : 'Verifică dacă a existat o regularizare sau un consum sezonier ridicat.';

                alerts.push({
                    type: 'growth',
                    severity: diffPct >= 30 ? 'high' : 'medium',
                    billType: bt,
                    badgeText: `⚠️ Creștere +${diffPct.toFixed(0)}% (+${diffDisp})`,
                    badgeBg: diffPct >= 30 ? '#ef4444' : '#f59e0b',
                    title: `${cleanBtName} - Creștere cost în ${latestM}`,
                    evaluation: `Factura a urcat de la <strong>${prevDisp}</strong> (${prevM}) la <strong>${latestDisp}</strong> (${latestM}), o creștere de <strong>+${diffPct.toFixed(1)}%</strong> (+${diffDisp}).`,
                    solution: targetedTip
                });
            }
        }

        // Pondere foarte mare din total (peste 35% din toate facturile) dacă nu a fost deja semnalată creștere
        if (sharePct >= 35 && !alerts.some(a => a.billType.key === bt.key)) {
            const totalDisp = formatMoney(convertFromRon(item.totalRon, mainCurr), mainCurr);
            const optSolution = BILL_OPTIMIZATION_SOLUTIONS[bt.key] || BILL_OPTIMIZATION_SOLUTIONS['other_bills'];
            const targetedTip = optSolution && optSolution.solutions && optSolution.solutions[0] ? optSolution.solutions[0] : 'Optimizează consumul de bază pentru reducerea cheltuielilor fixe.';

            alerts.push({
                type: 'share',
                severity: 'info',
                billType: bt,
                badgeText: `📊 Cost Principal (${sharePct.toFixed(0)}%)`,
                badgeBg: '#6366f1',
                title: `${cleanBtName} - Pondere majoră în facturi`,
                evaluation: `Această utilitate reprezintă <strong>${sharePct.toFixed(1)}%</strong> din totalul cheltuielilor tale cu facturile (${totalDisp}).`,
                solution: targetedTip
            });
        }
    });

    if (badgeEl) {
        if (alerts.length > 0) {
            badgeEl.textContent = `${alerts.length} ${alerts.length === 1 ? 'situație identificată' : 'situații identificate'}`;
            badgeEl.style.color = '#ef4444';
        } else {
            badgeEl.textContent = 'Consum optim';
            badgeEl.style.color = '#10b981';
        }
    }

    if (alerts.length === 0) {
        // Cazul în care NU sunt creșteri sau anomalii: afișăm doar o notă scurtă pozitivă
        container.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.35rem; flex-shrink: 0;">✅</span>
                <div>
                    <div style="font-weight: 800; font-size: 0.82rem; color: #10b981;">Consum & Costuri Stabile</div>
                    <div style="font-size: 0.70rem; color: var(--text-muted); margin-top: 1px;">Toate facturile sunt în parametri normali și constanți. Nu au fost detectate creșteri anormale de consum sau costuri excesive.</div>
                </div>
            </div>
        `;
        return;
    }

    // Afișăm exclusiv alertele / evaluările pentru utilitățile care chiar necesită atenție
    alerts.forEach(al => {
        const card = document.createElement('div');
        card.style.background = 'var(--item-bg)';
        card.style.border = al.severity === 'high' ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)';
        card.style.borderRadius = '8px';
        card.style.padding = '10px 12px';
        card.style.boxShadow = al.severity === 'high' ? '0 2px 8px rgba(239, 68, 68, 0.08)' : 'none';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 1.1rem;">${al.billType.icon}</span>
                    <strong style="font-size: 0.84rem; color: var(--text-color);">${escapeHtml(al.title)}</strong>
                </div>
                <span style="font-size: 0.68rem; font-weight: 800; color: #ffffff; background: ${al.badgeBg}; padding: 2px 7px; border-radius: 4px;">
                    ${escapeHtml(al.badgeText)}
                </span>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-color); background: var(--input-bg); border-radius: 6px; padding: 6px 8px; margin-bottom: 6px; border: 1px solid var(--border-color); line-height: 1.35;">
                <strong>📋 Evaluare:</strong> ${al.evaluation}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.35; padding-left: 2px;">
                <strong style="color: #10b981;">💡 Soluție recomandată:</strong> ${al.solution}
            </div>
        `;

        container.appendChild(card);
    });
}

function renderBillsTransactionsList(billsTxs, mainCurr, lang) {
    const listEl = document.getElementById('billsTransactionsList');
    const subInfoEl = document.getElementById('billsHistorySubInfo');
    const btnClearFilter = document.getElementById('btnClearBillsTypeFilter');
    if (!listEl) return;

    listEl.innerHTML = '';

    let filtered = currentFilteredBillTypeKey
        ? billsTxs.filter(item => item.billType.key === currentFilteredBillTypeKey)
        : billsTxs;

    if (btnClearFilter) {
        if (currentFilteredBillTypeKey) {
            const btObj = BILL_TYPES.find(b => b.key === currentFilteredBillTypeKey) || { name: 'Filtru' };
            btnClearFilter.style.display = 'inline-block';
            btnClearFilter.textContent = `✕ ${getCleanBillTypeName(btObj)}`;
            btnClearFilter.onclick = () => {
                currentFilteredBillTypeKey = null;
                renderBillsAnalytics();
            };
        } else {
            btnClearFilter.style.display = 'none';
        }
    }

    if (subInfoEl) {
        let filterSuffix = '';
        if (currentFilteredBillTypeKey) {
            const btObj = BILL_TYPES.find(b => b.key === currentFilteredBillTypeKey);
            if (btObj) filterSuffix = ` • ${getCleanBillTypeName(btObj)}`;
        }
        subInfoEl.textContent = `${filtered.length} ${lang === 'ro' ? 'facturi' : 'bills'}${filterSuffix}`;
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:18px; color:var(--text-muted); font-size:0.80rem;">${t('bills_empty', lang)}</div>`;
        return;
    }

    // Sortare cronologică descrescătoare
    const sorted = [...filtered].sort((a, b) => new Date(b.tx.date) - new Date(a.tx.date) || (b.tx.createdAt || 0) - (a.tx.createdAt || 0));

    sorted.forEach(item => {
        const tx = item.tx;
        const bt = item.billType;
        const cleanTypeName = getCleanBillTypeName(bt);
        const amtDisp = formatMoney(convertFromRon(item.amtRon, mainCurr), mainCurr);
        const mc = getTransactionMerchantAndComment(tx);
        const nameText = mc.merchant || tx.description || cleanTypeName;
        const commentText = mc.comment && mc.comment !== nameText ? mc.comment : '';
        const payMethod = tx.paymentMethod === 'cash' ? `💵 Cash` : `💳 Card`;

        const row = document.createElement('div');
        row.className = 'bills-tx-item';
        row.style.background = 'var(--item-bg)';
        row.style.border = '1px solid var(--border-color)';
        row.style.borderRadius = '8px';
        row.style.padding = '8px 10px';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.cursor = 'pointer';
        row.style.transition = 'all 0.15s ease';

        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: ${bt.color}18; border: 1px solid ${bt.color}40; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; flex-shrink: 0;">
                    ${bt.icon}
                </div>
                <div style="min-width: 0; flex: 1;">
                    <div style="font-weight: 700; font-size: 0.84rem; color: var(--text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(nameText)}
                    </div>
                    <div style="font-size: 0.68rem; color: var(--text-muted); display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 1px;">
                        <span>📅 ${formatDateDisplay(tx.date)}</span>
                        <span>•</span>
                        <span style="color: ${bt.color}; font-weight: 700;">${escapeHtml(cleanTypeName)}</span>
                        <span>•</span>
                        <span>${payMethod}</span>
                    </div>
                    ${commentText ? `<div style="font-size: 0.66rem; color: var(--text-dim); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">💬 ${escapeHtml(commentText)}</div>` : ''}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto;">
                <span class="expense-color" style="font-weight: 800; font-size: 0.90rem; white-space: nowrap;">-${amtDisp}</span>
                <button type="button" class="btn-edit-bill-tx" style="background: rgba(59, 130, 246, 0.12); color: var(--accent); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; padding: 4px 7px; font-size: 0.74rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;" title="Editează această factură">
                    ✏️
                </button>
            </div>
        `;

        row.addEventListener('click', (e) => {
            window.openEditExpenseModal(tx);
        });

        const editBtn = row.querySelector('.btn-edit-bill-tx');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.openEditExpenseModal(tx);
            });
        }

        listEl.appendChild(row);
    });
}

// Render Categories Management Tab (cu suport Drag & Drop reordonare)
function renderCategoriesManager() {
    const listEl = document.getElementById('categoriesManagerList');
    if (!listEl) return;
    listEl.innerHTML = '';

    appData.categories.forEach(cat => {
        // Count how many expenses are in this category
        const count = appData.transactions.filter(t => t.type === 'expense' && t.categoryId === cat.id).length;

        const row = document.createElement('div');
        row.className = 'cat-item-row';
        row.draggable = true;
        row.dataset.id = cat.id;
        row.style.cursor = 'grab';
        row.innerHTML = `
            <div class="cat-item-info">
                <span class="cat-color-badge" style="background-color: ${cat.color}; width:18px; height:18px; border-radius:6px; flex-shrink:0;"></span>
                <span style="font-size: 1.15rem; flex-shrink:0;">${cat.icon || '🏷️'}</span>
                <div>
                    <strong style="font-size: 0.9rem; color: var(--text-color);">${escapeHtml(cat.name)}</strong>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${count} ${t('lbl_registered_expenses')}</div>
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button class="icon-btn btn-edit-cat" title="${t('modal_edit_category')}" data-catid="${cat.id}">
                    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
                <button class="icon-btn btn-del-cat" title="Delete" data-catid="${cat.id}">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
        `;

        // Desktop Drag & Drop
        row.addEventListener('dragstart', (e) => {
            draggedCategoryId = cat.id;
            e.dataTransfer.setData('text/plain', cat.id);
            row.classList.add('dragging');
        });

        row.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        row.addEventListener('dragenter', () => {
            if (draggedCategoryId && draggedCategoryId !== cat.id) {
                row.classList.add('drag-over');
            }
        });

        row.addEventListener('dragleave', () => {
            row.classList.remove('drag-over');
        });

        row.addEventListener('dragend', () => {
            draggedCategoryId = null;
            document.querySelectorAll('#categoriesManagerList .cat-item-row').forEach(r => {
                r.classList.remove('dragging');
                r.classList.remove('drag-over');
            });
        });

        row.addEventListener('drop', (e) => {
            e.preventDefault();
            row.classList.remove('drag-over');
            const sourceId = e.dataTransfer.getData('text/plain') || draggedCategoryId;
            draggedCategoryId = null;
            if (sourceId && sourceId !== cat.id) {
                if (reorderCategories(sourceId, cat.id)) {
                    renderCategoriesManager();
                    renderExpenseCategoryPicker();
                    renderOverviewChartAndList();
                    showToast('Ordinea categoriilor a fost salvată!', 'info');
                }
            }
        });

        // Touch Drag for Categories Tab (Doar prin mânerul ☰ sau Hold lung)
        let rowTouchStartY = 0;
        let rowTouchStartX = 0;
        let rowTouchMoved = false;
        let rowIsDragging = false;
        let rowTargetEl = null;
        let rowHoldTimer = null;

        row.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            rowTouchStartX = e.touches[0].clientX;
            rowTouchStartY = e.touches[0].clientY;
            rowTouchMoved = false;
            rowIsDragging = false;
            rowTargetEl = null;

            rowHoldTimer = setTimeout(() => {
                rowIsDragging = true;
                row.classList.add('dragging');
                if (navigator.vibrate) { try { navigator.vibrate(30); } catch(err) {} }
            }, 380);
        }, { passive: true });

        row.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            const curX = e.touches[0].clientX;
            const curY = e.touches[0].clientY;
            const dist = Math.hypot(curX - rowTouchStartX, curY - rowTouchStartY);

            if (!rowIsDragging) {
                if (dist > 8) {
                    clearTimeout(rowHoldTimer);
                    rowTouchMoved = true;
                }
                return; // Lăsăm scroll-ul nativ să meargă nestingherit!
            }

            rowTouchMoved = true;
            if (e.cancelable) e.preventDefault();
            const elemUnder = document.elementFromPoint(curX, curY);
            const hoverRow = elemUnder ? elemUnder.closest('#categoriesManagerList .cat-item-row') : null;
            document.querySelectorAll('#categoriesManagerList .cat-item-row').forEach(r => {
                if (r !== hoverRow) r.classList.remove('drag-over');
            });
            if (hoverRow && hoverRow !== row) {
                hoverRow.classList.add('drag-over');
                rowTargetEl = hoverRow;
            } else {
                rowTargetEl = null;
            }
        }, { passive: false });

        row.addEventListener('touchend', () => {
            clearTimeout(rowHoldTimer);
            row.classList.remove('dragging');
            document.querySelectorAll('#categoriesManagerList .cat-item-row').forEach(r => r.classList.remove('drag-over'));
            if (rowIsDragging && rowTargetEl && rowTargetEl !== row) {
                const targetId = rowTargetEl.dataset.id;
                if (targetId && targetId !== cat.id) {
                    if (reorderCategories(cat.id, targetId)) {
                        renderCategoriesManager();
                        renderExpenseCategoryPicker();
                        renderOverviewChartAndList();
                        showToast('Ordinea categoriilor a fost salvată!', 'info');
                    }
                }
            }
            rowIsDragging = false;
            rowTouchMoved = false;
            rowTargetEl = null;
        });

        row.addEventListener('touchcancel', () => {
            clearTimeout(rowHoldTimer);
            row.classList.remove('dragging');
            document.querySelectorAll('#categoriesManagerList .cat-item-row').forEach(r => r.classList.remove('drag-over'));
            rowIsDragging = false;
            rowTouchMoved = false;
            rowTargetEl = null;
        });

        row.querySelector('.btn-edit-cat').addEventListener('click', (e) => {
            e.stopPropagation();
            openCategoryEditModal(cat);
        });

        row.querySelector('.btn-del-cat').addEventListener('click', (e) => {
            e.stopPropagation();
            if (appData.categories.length <= 1) {
                showToast('Trebuie să păstrați cel puțin o categorie!', 'error');
                return;
            }
            if (confirm(`Sigur doriți să ștergeți categoria "${cat.name}"?`)) {
                appData.categories = appData.categories.filter(c => c.id !== cat.id);
                saveData();
                renderCategoriesManager();
                renderExpenseCategoryPicker();
                renderOverviewChartAndList();
                showToast('Categoria a fost ștearsă.', 'info');
            }
        });

        listEl.appendChild(row);
    });
}

// Detectează domeniul/tipul categoriei active pentru aranjare inteligentă
function getCategoryDomain(catId) {
    if (!catId) return 'general';
    const cat = (appData && Array.isArray(appData.categories)) ? appData.categories.find(c => c.id === catId) : null;
    if (!cat) return 'general';
    const raw = ((cat.name || '') + ' ' + (cat.icon || '')).toLowerCase();

    if (raw.includes('fast food') || raw.includes('fastfood') || raw.includes('fast-food') || raw.includes('burger') || raw.includes('pizza') || raw.includes('shaorma') || raw.includes('kebab') || raw.includes('mcdonald') || raw.includes('kfc') || raw.includes('cantina') || raw.includes('delivery')) {
        return 'fastfood';
    }
    if (raw.includes('mancare') || raw.includes('mâncare') || raw.includes('aliment') || raw.includes('supermarket') || raw.includes('piata') || raw.includes('piață') || raw.includes('hypermarket') || raw.includes('bacanie') || raw.includes('băcănie') || raw.includes('grocer')) {
        return 'food';
    }
    if (raw.includes('haine') || raw.includes('imbracaminte') || raw.includes('îmbrăcăminte') || raw.includes('fashion') || raw.includes('incaltaminte') || raw.includes('încălțăminte') || raw.includes('pantofi') || raw.includes('cumparatur') || raw.includes('cumpărături') || raw.includes('shopping') || raw.includes('cloth') || raw.includes('dress')) {
        return 'fashion';
    }
    if (raw.includes('transport') || raw.includes('combustibil') || raw.includes('carburant') || raw.includes('benzina') || raw.includes('benzină') || raw.includes('motorina') || raw.includes('motorină') || raw.includes('gpl') || raw.includes('auto') || raw.includes('masina') || raw.includes('mașină') || raw.includes('taxi') || raw.includes('uber') || raw.includes('bolt') || raw.includes('peco') || raw.includes('stb') || raw.includes('cfr')) {
        return 'transport';
    }
    if (raw.includes('sanatate') || raw.includes('sănătate') || raw.includes('farmacie') || raw.includes('medical') || raw.includes('medicament') || raw.includes('doctor') || raw.includes('medic') || raw.includes('dentist') || raw.includes('stomatolog') || raw.includes('clinica') || raw.includes('clinică') || raw.includes('analize') || raw.includes('spital') || raw.includes('pharma')) {
        return 'health';
    }
    if (raw.includes('locuinta') || raw.includes('locuință') || raw.includes('chirie') || raw.includes('casa') || raw.includes('casă') || raw.includes('mobila') || raw.includes('mobilă') || raw.includes('amenajare') || raw.includes('bricolaj') || raw.includes('curatenie') || raw.includes('curățenie') || raw.includes('gradina') || raw.includes('grădină')) {
        return 'home';
    }
    if (raw.includes('electronice') || raw.includes('it') || raw.includes('gadget') || raw.includes('electrocasnice') || raw.includes('telefon') || raw.includes('pc') || raw.includes('laptop') || raw.includes('tech')) {
        return 'tech';
    }
    if (raw.includes('facturi') || raw.includes('utilitati') || raw.includes('utilități') || raw.includes('curent') || raw.includes('gaz') || raw.includes('gaze') || raw.includes('energie') || raw.includes('apa') || raw.includes('apă') || raw.includes('salubritate') || raw.includes('gunoi') || raw.includes('internet') || raw.includes('tv') || raw.includes('telefonie') || raw.includes('telefon') || raw.includes('impozit') || raw.includes('taxe') || raw.includes('chirie') || raw.includes('întreținere') || raw.includes('intretinere') || raw.includes('asociație') || raw.includes('asociatie') || raw.includes('electric') || raw.includes('rate') || raw.includes('rată') || raw.includes('credit') || raw.includes('asigurare') || raw.includes('⚡') || raw.includes('💡') || raw.includes('🔥') || raw.includes('💧') || raw.includes('📶') || raw.includes('📱') || raw.includes('🏢') || raw.includes('🏛️') || raw.includes('🗑️') || raw.includes('🛡️')) {
        return 'utilities';
    }
    if (raw.includes('divertisment') || raw.includes('iesiri') || raw.includes('ieșiri') || raw.includes('cinema') || raw.includes('film') || raw.includes('jocuri') || raw.includes('gaming') || raw.includes('concediu') || raw.includes('vacanta') || raw.includes('vacanță') || raw.includes('calatorie') || raw.includes('călătorie')) {
        return 'entertainment';
    }
    return 'general';
}

// Verifică dacă o categorie are activată lista de magazine
function isMerchantEnabledForCategory(catId) {
    if (!catId) return false;
    if (!appData.settings) appData.settings = {};
    if (!Array.isArray(appData.settings.merchantEnabledCategoryIds)) {
        return true; // Implicit activ pentru orice categorie
    }
    return appData.settings.merchantEnabledCategoryIds.includes(catId);
}

// Returnează sigla reală / insigna stilizată pentru orice magazin
function getMerchantLogoHtml(name, size = 18) {
    if (!name || typeof name !== 'string') return `<span>🛒</span>`;
    const clean = name.trim();
    const lower = clean.toLowerCase();
    
    // 1. Sigle reale dedicate pentru branduri cunoscute din România & internaționale
    // Fast Food & Restaurante
    if (lower.includes('mcdonald') || lower.includes('mc ')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#da291c;color:#ffc72c;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.58)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.2);">M</span>`;
    }
    if (lower.includes('kfc')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e4002b;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">KFC</span>`;
    }
    if (lower.includes('burger king') || lower.includes('burgerking')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#502314;border:1px solid #d62300;color:#ff8732;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">BK</span>`;
    }
    if (lower.includes('subway')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#008c15;color:#ffc20e;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">SUB</span>`;
    }
    if (lower.includes('dristor')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#8b0000;color:#ffd700;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">DK</span>`;
    }
    if (lower.includes('mesopotamia')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#b22222;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;">MESO</span>`;
    }
    if (lower.includes('spartan')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#c0392b;color:#f39c12;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">SPT</span>`;
    }
    if (lower.includes('taco bell') || lower.includes('tacobell')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#702082;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.48)}px;line-height:1;">🔔</span>`;
    }
    if (lower.includes('popeyes')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#f15a24;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">POP</span>`;
    }
    if (lower.includes('pizza hut')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ee3124;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.48)}px;line-height:1;">🍕</span>`;
    }
    if (lower.includes('domino')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#006491;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.48)}px;line-height:1;">🍕</span>`;
    }
    if (lower.includes('starbucks')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#00704a;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.48)}px;line-height:1;">☕</span>`;
    }
    if (lower.includes('5 to go') || lower.includes('5togo')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.55)}px;line-height:1;">5</span>`;
    }

    // Supermarketuri & Magazine Mâncare
    if (lower.includes('emag')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#005eb8;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.4)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.2);"><span style="color:#e21e26;">e</span>MAG</span>`;
    }
    if (lower.includes('lidl')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#0050aa;border:1.5px solid #d61b1f;color:#fff000;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">LIDL</span>`;
    }
    if (lower.includes('kaufland')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e2001a;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.55)}px;line-height:1;">K</span>`;
    }
    if (lower.includes('carrefour')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#fff;border:1px solid #e2e8f0;color:#004e9a;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.55)}px;line-height:1;"><span style="color:#004e9a;">C</span><span style="color:#e2001a;font-size:${Math.round(size*0.4)}px;">◆</span></span>`;
    }
    if (lower.includes('mega image') || lower.includes('mega')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e30613;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">MI</span>`;
    }
    if (lower.includes('penny')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#cd141e;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.4)}px;line-height:1;">PENNY</span>`;
    }
    if (lower.includes('auchan')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#fff;border:1px solid #e2e8f0;color:#e2001a;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.55)}px;line-height:1;">A</span>`;
    }
    if (lower.includes('profi')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e30613;color:#ffdd00;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">profi</span>`;
    }
    if (lower.includes('freshful')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#2d8259;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;">freshful</span>`;
    }
    if (lower.includes('sezamo')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#eab308;color:#000;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">SEZ</span>`;
    }
    if (lower.includes('petresti') || lower.includes('petrești')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#d97706;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.40)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.15);">PET</span>`;
    }
    if (lower.includes('ardeal')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#b91c1c;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.40)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.15);">ARD</span>`;
    }
    if (lower.includes('unicarm')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#b91c1c;color:#ffd700;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.36)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.15);">UNI</span>`;
    }
    if (lower.includes('diana')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#dc2626;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">DIA</span>`;
    }
    if (lower.includes('annabella')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ef4444;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.36)}px;line-height:1;">ANN</span>`;
    }
    if (lower.includes('sergiana')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#991b1b;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.36)}px;line-height:1;">SER</span>`;
    }
    if (lower.includes('metro')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#002b49;color:#ffdd00;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.36)}px;line-height:1;">METRO</span>`;
    }
    if (lower.includes('selgros')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e30613;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;">SELGROS</span>`;
    }

    // Tech & Servicii Online
    if (lower.includes('google')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#fff;border:1px solid #e2e8f0;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.58)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.1);"><span style="color:#4285f4;">G</span></span>`;
    }
    if (lower.includes('apple')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.50)}px;line-height:1;"></span>`;
    }
    if (lower.includes('netflix')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#e50914;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.55)}px;line-height:1;">N</span>`;
    }
    if (lower.includes('spotify')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#1db954;color:#000;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.50)}px;line-height:1;">•))</span>`;
    }

    // Magazine Haine & Shopping
    if (lower.includes('h&m') || lower.includes('hm')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#fff;border:1px solid #e2e8f0;color:#e50010;font-family:sans-serif;font-style:italic;font-weight:900;font-size:${Math.round(size*0.48)}px;line-height:1;">H&M</span>`;
    }
    if (lower.includes('zara')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">ZARA</span>`;
    }
    if (lower.includes('bershka')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">BSK</span>`;
    }
    if (lower.includes('pull&bear') || lower.includes('pull & bear') || lower.includes('pull and bear')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">P&B</span>`;
    }
    if (lower.includes('stradivarius')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">STR</span>`;
    }
    if (lower.includes('waikiki') || lower.includes('lcw')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#003399;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">LCW</span>`;
    }
    if (lower.includes('pepco')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#002d72;color:#ff7900;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.4)}px;line-height:1;">PEPCO</span>`;
    }
    if (lower.includes('sinsay')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e91e63;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">SIN</span>`;
    }
    if (lower.includes('reserved')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">RSV</span>`;
    }
    if (lower.includes('decathlon')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#0082c3;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">DEC</span>`;
    }
    if (lower.includes('nike')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#111;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">NIKE</span>`;
    }
    if (lower.includes('adidas')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">ADI</span>`;
    }

    // Transport & Combustibil
    if (lower.includes('omv')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#005da4;color:#78be20;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">OMV</span>`;
    }
    if (lower.includes('petrom')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#00386b;color:#ffcc00;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;">PETROM</span>`;
    }
    if (lower.includes('mol')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#008751;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.48)}px;line-height:1;">MOL</span>`;
    }
    if (lower.includes('rompetrol')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ea5404;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.4)}px;line-height:1;">RMP</span>`;
    }
    if (lower.includes('lukoil')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ed1b24;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;">LUKOIL</span>`;
    }
    if (lower.includes('uber')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">Uber</span>`;
    }
    if (lower.includes('bolt')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#34d186;color:#111;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">Bolt</span>`;
    }
    if (lower.includes('glovo')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ffc244;color:#00a082;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">Glovo</span>`;
    }
    if (lower.includes('tazz')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e30613;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">tazz</span>`;
    }

    // Sănătate & Farmacii
    if (lower.includes('tei') || lower.includes('farmacia tei')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#00833e;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">TEI</span>`;
    }
    if (lower.includes('catena')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#009640;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;">CATENA</span>`;
    }
    if (lower.includes('dr. max') || lower.includes('drmax') || lower.includes('max')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#78be20;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;">Dr.Max</span>`;
    }
    if (lower.includes('help net') || lower.includes('helpnet')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e30613;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">HELP</span>`;
    }

    // Casă, Bricolaj & Electronice
    if (lower.includes('dedeman')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#00457c;color:#ff6600;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">DDM</span>`;
    }
    if (lower.includes('ikea')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#0051ba;color:#ffda1a;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">IKEA</span>`;
    }
    if (lower.includes('jysk')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#002b66;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">JYSK</span>`;
    }
    if (lower.includes('leroy')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#57a531;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.45)}px;line-height:1;">LM</span>`;
    }
    if (lower.includes('altex')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ffcc00;color:#000;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">ALTEX</span>`;
    }
    if (lower.includes('flanco')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ffdd00;color:#e2001a;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;">FLANCO</span>`;
    }
    if (lower.includes('dm') || lower.includes('drogerie')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#fff;border:1px solid #e2e8f0;color:#502379;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.55)}px;line-height:1;">dm</span>`;
    }

    // Utilități & Energie & Telecom & Taxe
    if (lower.includes('hidroelectrica') || lower.includes('hidro')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#006699;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">HIDRO</span>`;
    }
    if (lower.includes('electrica')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#004b93;color:#ffd700;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">⚡EL</span>`;
    }
    if (lower.includes('enel') || lower.includes('ppc')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#008a00;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">PPC</span>`;
    }
    if (lower.includes('e.on') || lower.includes('eon')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ed1c24;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">e.on</span>`;
    }
    if (lower.includes('engie')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#00aaff;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">ENGIE</span>`;
    }
    if (lower.includes('premier') || lower.includes('premier energy')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#0d9488;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">PRM</span>`;
    }
    if (lower.includes('digi') || lower.includes('rcs') || lower.includes('rds')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#005baa;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">DIGI</span>`;
    }
    if (lower.includes('orange') || lower.includes('yoxo')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#ff6600;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">ORANGE</span>`;
    }
    if (lower.includes('vodafone')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e60000;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">VODA</span>`;
    }
    if (lower.includes('telekom')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#e20074;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.55)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">T</span>`;
    }
    if (lower.includes('apa nova') || lower.includes('apanova') || lower.includes('compania de apa') || lower.includes('raja') || lower.includes('aquatim') || lower.includes('apavital')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#0284c7;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.42)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">💧APĂ</span>`;
    }
    if (lower.includes('ghiseul') || lower.includes('ghișeul') || lower.includes('anaf') || lower.includes('ditl') || lower.includes('primarie') || lower.includes('primărie') || lower.includes('taxe')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#1e3a8a;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">🏛️TAX</span>`;
    }
    if (lower.includes('chirie') || lower.includes('proprietar')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#d97706;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">🏠RENT</span>`;
    }
    if (lower.includes('intretinere') || lower.includes('întreținere') || lower.includes('asociatie') || lower.includes('asociație')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#475569;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.35)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">🏢BLOC</span>`;
    }
    if (lower.includes('salubritate') || lower.includes('gunoi') || lower.includes('rebu') || lower.includes('supercom') || lower.includes('brantner') || lower.includes('rosal') || lower.includes('romprest')) {
        return `<span class="merchant-brand-logo" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:#15803d;color:#fff;font-family:sans-serif;font-weight:900;font-size:${Math.round(size*0.38)}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">🗑️SAL</span>`;
    }

    if (lower.includes('piata') || lower.includes('piață')) return `<span>🥦</span>`;
    if (lower.includes('aprozar')) return `<span>🍅</span>`;
    if (lower.includes('brutarie') || lower.includes('brutărie')) return `<span>🥖</span>`;
    if (lower.includes('macelarie') || lower.includes('măcelărie')) return `<span>🥩</span>`;
    if (lower.includes('restaurant')) return `<span>🍽️</span>`;

    // 2. Fallback inteligent pentru orice magazin personalizat nou (insignă colorată distinctă cu inițiale)
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
        hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#059669', '#0891b2', '#4f46e5', '#d97706'];
    const brandColor = colors[Math.abs(hash) % colors.length];
    const initials = clean.split(/\s+/).map(w => w[0]).join('').substring(0, 3).toUpperCase() || clean.substring(0, 2).toUpperCase();

    return `<span class="merchant-brand-logo merchant-brand-custom" style="width:${size}px;height:${size}px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;background:${brandColor};color:#ffffff;font-family:sans-serif;font-weight:800;font-size:${Math.max(9, Math.round(size*0.48))}px;line-height:1;box-shadow:0 1px 2px rgba(0,0,0,0.18);">${initials}</span>`;
}

// Returnează iconița vizuală specifică bonului (articol din lista de cumpărături sau sigla magazinului)
function getReceiptVisualIcon(tx, m) {
    const desc = (tx.description || '').toLowerCase().trim();
    const cat = appData.categories.find(c => c.id === tx.categoryId);

    if (desc) {
        if (desc.includes('apa') || desc.includes('apă')) return '💧';
        if (desc.includes('strudel') || desc.includes('ștrudel') || desc.includes('croissant') || desc.includes('patiserie') || desc.includes('placinta') || desc.includes('plăcintă') || desc.includes('covrig')) return '🥐';
        if (desc.includes('suc') || desc.includes('cola') || desc.includes('fanta') || desc.includes('pepsi') || desc.includes('sprite') || desc.includes('fresh')) return '🧃';
        if (desc.includes('cafea') || desc.includes('cappuccino') || desc.includes('espresso') || desc.includes('latte')) return '☕';
        if (desc.includes('paine') || desc.includes('pâine') || desc.includes('bagheta') || desc.includes('chifla')) return '🥖';
        if (desc.includes('lapte') || desc.includes('iaurt') || desc.includes('kefir') || desc.includes('smantana') || desc.includes('smântână')) return '🥛';
        if (desc.includes('oua') || desc.includes('ouă')) return '🥚';
        if (desc.includes('carne') || desc.includes('ceafa') || desc.includes('cotlet') || desc.includes('porc') || desc.includes('vita') || desc.includes('vită')) return '🥩';
        if (desc.includes('pui') || desc.includes('aripi') || desc.includes('piept') || desc.includes('copanele')) return '🍗';
        if (desc.includes('peste') || desc.includes('pește') || desc.includes('somon') || desc.includes('ton')) return '🐟';
        if (desc.includes('branza') || desc.includes('brânză') || desc.includes('cascaval') || desc.includes('cașcaval') || desc.includes('telemea') || desc.includes('mozzarella')) return '🧀';
        if (desc.includes('mezel') || desc.includes('salam') || desc.includes('sunca') || desc.includes('șuncă') || desc.includes('bacon') || desc.includes('parizer')) return '🥓';
        if (desc.includes('fruct') || desc.includes('mere') || desc.includes('banan') || desc.includes('portocal') || desc.includes('lamai') || desc.includes('capsun') || desc.includes('căpșun')) return '🍎';
        if (desc.includes('legum') || desc.includes('rosii') || desc.includes('roșii') || desc.includes('castrav') || desc.includes('cartof') || desc.includes('ceapa') || desc.includes('usturoi') || desc.includes('salata') || desc.includes('salată')) return '🥦';
        if (desc.includes('dulci') || desc.includes('ciocolat') || desc.includes('biscuit') || desc.includes('napolit') || desc.includes('bomboan')) return '🍫';
        if (desc.includes('inghetata') || desc.includes('înghețată')) return '🍦';
        if (desc.includes('tort') || desc.includes('prajitur') || desc.includes('prăjitur')) return '🍰';
        if (desc.includes('pizza')) return '🍕';
        if (desc.includes('burger') || desc.includes('kebab') || desc.includes('shaorma') || desc.includes('sandwich')) return '🍔';
        if (desc.includes('bere')) return '🍺';
        if (desc.includes('vin')) return '🍷';
        if (desc.includes('pisic') || desc.includes('caine') || desc.includes('câine') || desc.includes('animale') || desc.includes('pet food') || desc.includes('pedigree') || desc.includes('whiskas') || desc.includes('purina')) return '🐱';
        if (desc.includes('medicament') || desc.includes('pastil') || desc.includes('vitam') || desc.includes('sirop') || desc.includes('aspirin') || desc.includes('paracetamol')) return '💊';
        if (desc.includes('detergent') || desc.includes('sapun') || desc.includes('săpun') || desc.includes('sampon') || desc.includes('șampon') || desc.includes('gel dus') || desc.includes('hartie igienica') || desc.includes('hârtie igienică')) return '🧼';
        if (desc.includes('benzina') || desc.includes('benzină') || desc.includes('motorina') || desc.includes('motorină') || desc.includes('gpl') || desc.includes('carburant')) return '⛽';
        if (desc.includes('curent') || desc.includes('electr') || desc.includes('lumina') || desc.includes('lumină') || desc.includes('energie')) return '💡';
        if (desc.includes('gaz') || desc.includes('gaze') || desc.includes('incalzire') || desc.includes('încălzire') || desc.includes('termo')) return '🔥';
        if (desc.includes('canal') || desc.includes('apa nova') || desc.includes('apanova')) return '💧';
        if (desc.includes('internet') || desc.includes('cablu') || desc.includes('fibra') || desc.includes('tv')) return '📶';
        if (desc.includes('telefon') || desc.includes('mobil') || desc.includes('abonament')) return '📱';
        if (desc.includes('chirie') || desc.includes('garsoniera') || desc.includes('apartament')) return '🏠';
        if (desc.includes('intretinere') || desc.includes('întreținere') || desc.includes('asociatie') || desc.includes('asociație') || desc.includes('bloc')) return '🏢';
        if (desc.includes('impozit') || desc.includes('taxa') || desc.includes('taxă') || desc.includes('ditl') || desc.includes('anaf') || desc.includes('primarie') || desc.includes('primărie')) return '🏛️';
        if (desc.includes('salubritate') || desc.includes('gunoi') || desc.includes('deseuri') || desc.includes('deșeuri')) return '🗑️';
        if (desc.includes('asigurare') || desc.includes('pad') || desc.includes('casco') || desc.includes('rca')) return '🛡️';
        if (desc.includes('rata') || desc.includes('rată') || desc.includes('credit') || desc.includes('banca') || desc.includes('bancă') || desc.includes('leasing')) return '💳';

        if (appData.settings && Array.isArray(appData.settings.customShoppingItems)) {
            const customItem = appData.settings.customShoppingItems.find(i => i && i.name && (desc === i.name.toLowerCase().trim() || desc.includes(i.name.toLowerCase().trim())));
            if (customItem && customItem.icon) return customItem.icon;
        }
    }

    return getMerchantLogoHtml(m ? m.name : (tx.merchant || ''), 28);
}

// Extrage lista de magazine ordonate inteligent în funcție de categoria activă și frecvența de utilizare
function getFoodMerchantsList(activeCatId) {
    const activeDomain = getCategoryDomain(activeCatId);

    // Catalog bogat de magazine cu apartenență de domeniu
    const defaultStores = [
        // Fast Food & Delivery & Restaurante
        { name: "McDonald's", domain: 'fastfood', priority: 95 },
        { name: 'KFC', domain: 'fastfood', priority: 94 },
        { name: 'Burger King', domain: 'fastfood', priority: 92 },
        { name: 'Dristor Kebap', domain: 'fastfood', priority: 90 },
        { name: 'Mesopotamia', domain: 'fastfood', priority: 89 },
        { name: 'Spartan', domain: 'fastfood', priority: 88 },
        { name: 'Pizza Hut', domain: 'fastfood', priority: 86 },
        { name: "Domino's Pizza", domain: 'fastfood', priority: 85 },
        { name: 'Subway', domain: 'fastfood', priority: 84 },
        { name: 'Taco Bell', domain: 'fastfood', priority: 83 },
        { name: 'Popeyes', domain: 'fastfood', priority: 82 },
        { name: 'Trenta Pizza', domain: 'fastfood', priority: 81 },
        { name: 'Starbucks', domain: 'fastfood', priority: 80 },
        { name: '5 to go', domain: 'fastfood', priority: 79 },
        { name: 'Glovo', domain: 'fastfood', priority: 85 },
        { name: 'Tazz', domain: 'fastfood', priority: 84 },
        { name: 'Restaurant', domain: 'fastfood', priority: 75 },

        // Supermarketuri & Mâncare
        { name: 'Lidl', domain: 'food', priority: 95 },
        { name: 'Kaufland', domain: 'food', priority: 94 },
        { name: 'Carrefour', domain: 'food', priority: 92 },
        { name: 'Mega Image', domain: 'food', priority: 90 },
        { name: 'Penny', domain: 'food', priority: 88 },
        { name: 'Auchan', domain: 'food', priority: 86 },
        { name: 'Profi', domain: 'food', priority: 85 },
        { name: 'Freshful', domain: 'food', priority: 84 },
        { name: 'Piață', domain: 'food', priority: 82 },
        { name: 'Aprozar', domain: 'food', priority: 80 },
        { name: 'Măcelărie', domain: 'food', priority: 78 },
        { name: 'Brutărie', domain: 'food', priority: 76 },

        // Cumpărături, Haine & Fashion
        { name: 'Zara', domain: 'fashion', priority: 95 },
        { name: 'H&M', domain: 'fashion', priority: 94 },
        { name: 'Bershka', domain: 'fashion', priority: 92 },
        { name: 'Pull&Bear', domain: 'fashion', priority: 90 },
        { name: 'Stradivarius', domain: 'fashion', priority: 88 },
        { name: 'LC Waikiki', domain: 'fashion', priority: 87 },
        { name: 'Pepco', domain: 'fashion', priority: 86 },
        { name: 'Sinsay', domain: 'fashion', priority: 85 },
        { name: 'Reserved', domain: 'fashion', priority: 84 },
        { name: 'C&A', domain: 'fashion', priority: 82 },
        { name: 'New Yorker', domain: 'fashion', priority: 80 },
        { name: 'Decathlon', domain: 'fashion', priority: 85 },
        { name: 'Nike', domain: 'fashion', priority: 83 },
        { name: 'Adidas', domain: 'fashion', priority: 82 },
        { name: 'Deichmann', domain: 'fashion', priority: 80 },

        // Transport & Combustibil & Auto
        { name: 'OMV', domain: 'transport', priority: 95 },
        { name: 'Petrom', domain: 'transport', priority: 94 },
        { name: 'MOL', domain: 'transport', priority: 92 },
        { name: 'Rompetrol', domain: 'transport', priority: 90 },
        { name: 'Lukoil', domain: 'transport', priority: 88 },
        { name: 'Uber', domain: 'transport', priority: 90 },
        { name: 'Bolt', domain: 'transport', priority: 89 },
        { name: 'STB', domain: 'transport', priority: 85 },
        { name: 'CFR', domain: 'transport', priority: 84 },
        { name: 'Spălătorie Auto', domain: 'transport', priority: 82 },
        { name: 'Vulcanizare', domain: 'transport', priority: 80 },

        // Sănătate & Farmacie
        { name: 'Farmacia Tei', domain: 'health', priority: 95 },
        { name: 'Catena', domain: 'health', priority: 94 },
        { name: 'Dr. Max', domain: 'health', priority: 93 },
        { name: 'Help Net', domain: 'health', priority: 90 },
        { name: 'MedLife', domain: 'health', priority: 85 },
        { name: 'Regina Maria', domain: 'health', priority: 84 },

        // Casă, Bricolaj & Mobilă
        { name: 'Dedeman', domain: 'home', priority: 95 },
        { name: 'IKEA', domain: 'home', priority: 94 },
        { name: 'Leroy Merlin', domain: 'home', priority: 92 },
        { name: 'JYSK', domain: 'home', priority: 90 },
        { name: 'DM', domain: 'home', priority: 88 },

        // Electronice & IT
        { name: 'eMAG', domain: 'tech', priority: 95 },
        { name: 'Altex', domain: 'tech', priority: 94 },
        { name: 'Flanco', domain: 'tech', priority: 90 },

        // Facturi, Energie, Utilități, Telecom & Taxe
        { name: 'Hidroelectrica', domain: 'utilities', priority: 98 },
        { name: 'Electrica Furnizare', domain: 'utilities', priority: 97 },
        { name: 'Engie', domain: 'utilities', priority: 96 },
        { name: 'PPC (Enel)', domain: 'utilities', priority: 95 },
        { name: 'E.ON', domain: 'utilities', priority: 94 },
        { name: 'Digi (RCS-RDS)', domain: 'utilities', priority: 93 },
        { name: 'Apa Nova', domain: 'utilities', priority: 92 },
        { name: 'Premier Energy', domain: 'utilities', priority: 91 },
        { name: 'Compania de Apă', domain: 'utilities', priority: 90 },
        { name: 'Orange', domain: 'utilities', priority: 89 },
        { name: 'Vodafone', domain: 'utilities', priority: 88 },
        { name: 'Telekom', domain: 'utilities', priority: 87 },
        { name: 'Întreținere Bloc', domain: 'utilities', priority: 86 },
        { name: 'Chirie Apartament', domain: 'utilities', priority: 85 },
        { name: 'Ghișeul.ro', domain: 'utilities', priority: 84 },
        { name: 'Primărie / DITL', domain: 'utilities', priority: 83 },
        { name: 'Salubritate / Gunoi', domain: 'utilities', priority: 82 },
        { name: 'Nova Power & Gas', domain: 'utilities', priority: 81 },
        { name: 'Restart Energy', domain: 'utilities', priority: 80 },
        { name: 'Tinmar Energy', domain: 'utilities', priority: 79 },
        { name: 'Asociație Proprietari', domain: 'utilities', priority: 78 },
        { name: 'ANAF / Taxe', domain: 'utilities', priority: 77 }
    ];

    const hidden = (appData && appData.settings && Array.isArray(appData.settings.hiddenMerchants))
        ? appData.settings.hiddenMerchants.map(h => String(h).toLowerCase().trim())
        : [];

    const storeMap = new Map();
    defaultStores.forEach(s => {
        const key = s.name.toLowerCase().trim();
        if (!hidden.includes(key)) {
            storeMap.set(key, { ...s, count: 0, catCount: 0 });
        }
    });

    // Încărcare magazine personalizate adăugate de utilizator
    if (appData && appData.settings && Array.isArray(appData.settings.customMerchants)) {
        appData.settings.customMerchants.forEach(cm => {
            if (cm && cm.name) {
                const key = cm.name.toLowerCase().trim();
                if (!hidden.includes(key)) {
                    if (!storeMap.has(key)) {
                        storeMap.set(key, {
                            name: cm.name,
                            domain: cm.categoryId ? getCategoryDomain(cm.categoryId) : 'custom',
                            priority: 70,
                            count: 1,
                            catCount: (cm.categoryId === activeCatId ? 5 : 0),
                            isCustom: true,
                            categoryId: cm.categoryId || null
                        });
                    } else {
                        const existing = storeMap.get(key);
                        existing.isCustom = true;
                        if (cm.categoryId === activeCatId) {
                            existing.catCount += 5;
                        }
                    }
                }
            }
        });
    }

    // Numărare frecvență utilizare tranzacții
    if (appData && Array.isArray(appData.transactions)) {
        appData.transactions.forEach(t => {
            if (t.type === 'expense') {
                const merchName = (t.merchant || '').trim();
                if (merchName) {
                    const merchLower = merchName.toLowerCase();
                    if (!hidden.includes(merchLower)) {
                        if (!storeMap.has(merchLower)) {
                            storeMap.set(merchLower, {
                                name: merchName,
                                domain: (t.categoryId === activeCatId ? activeDomain : getCategoryDomain(t.categoryId)),
                                priority: 50,
                                count: 1,
                                catCount: (t.categoryId === activeCatId ? 1 : 0),
                                isCustom: true
                            });
                        } else {
                            const store = storeMap.get(merchLower);
                            store.count += 1;
                            if (t.categoryId === activeCatId) {
                                store.catCount += 1;
                            }
                        }
                    }
                }
            }
        });
    }

    // Calcul scor inteligent:
    // 1. Tranzacții în categoria activă (catCount) -> prioritate maximă absolută!
    // 2. Apartenență la domeniul categoriei active (Fast Food -> Fast Food primele, Haine -> Haine primele)
    // 3. Frecvență generală tranzacții (count)
    // 4. Prioritate prestabilită a brandului
    const storesList = Array.from(storeMap.values());
    storesList.forEach(store => {
        let score = 0;
        const isDomainMatch = (activeDomain !== 'general' && store.domain === activeDomain);
        const isDirectCatMatch = (store.categoryId && store.categoryId === activeCatId);

        if (store.catCount > 0) {
            score += 10000 + (store.catCount * 250);
        } else if (isDirectCatMatch) {
            score += 5000;
        } else if (isDomainMatch) {
            score += 2000 + (store.priority || 50);
        }

        score += (store.count * 15);
        if (!isDomainMatch && !isDirectCatMatch && store.catCount === 0) {
            score += (store.priority || 10);
        }

        store.smartScore = score;
    });

    storesList.sort((a, b) => b.smartScore - a.smartScore);
    return storesList;
}

// Extrage lista de cumpărături / articole ordonate inteligent după categoria activă și frecvență
function getFoodShoppingItemsList(activeCatId) {
    const activeDomain = getCategoryDomain(activeCatId);

    // Catalog cuprinzător de articole cu emoji și domeniu asociat
    const defaultItems = [
        // Fast Food
        { name: 'Burger', icon: '🍔', domain: 'fastfood', priority: 95 },
        { name: 'Meniu Burger', icon: '🍟', domain: 'fastfood', priority: 94 },
        { name: 'Shaorma', icon: '🌯', domain: 'fastfood', priority: 93 },
        { name: 'Pizza', icon: '🍕', domain: 'fastfood', priority: 92 },
        { name: 'Cartofi prăjiți', icon: '🍟', domain: 'fastfood', priority: 90 },
        { name: 'Aripioare pui', icon: '🍗', domain: 'fastfood', priority: 89 },
        { name: 'Crispy Strips', icon: '🍗', domain: 'fastfood', priority: 88 },
        { name: 'Sandwich', icon: '🥪', domain: 'fastfood', priority: 87 },
        { name: 'Sosuri', icon: '🥫', domain: 'fastfood', priority: 86 },
        { name: 'Kebab', icon: '🥙', domain: 'fastfood', priority: 85 },
        { name: 'Noodles', icon: '🍜', domain: 'fastfood', priority: 84 },
        { name: 'Sushi', icon: '🍣', domain: 'fastfood', priority: 83 },
        { name: 'Clătite', icon: '🥞', domain: 'fastfood', priority: 82 },

        // Mâncare & Supermarket
        { name: 'Pâine', icon: '🥖', domain: 'food', priority: 95 },
        { name: 'Lapte', icon: '🥛', domain: 'food', priority: 94 },
        { name: 'Ouă', icon: '🥚', domain: 'food', priority: 93 },
        { name: 'Carne', icon: '🥩', domain: 'food', priority: 92 },
        { name: 'Pui', icon: '🍗', domain: 'food', priority: 91 },
        { name: 'Legume', icon: '🥦', domain: 'food', priority: 90 },
        { name: 'Fructe', icon: '🍎', domain: 'food', priority: 89 },
        { name: 'Apă', icon: '💧', domain: 'food', priority: 88 },
        { name: 'Suc', icon: '🧃', domain: 'food', priority: 87 },
        { name: 'Cafea', icon: '☕', domain: 'food', priority: 86 },
        { name: 'Dulciuri', icon: '🍫', domain: 'food', priority: 85 },
        { name: 'Brânzeturi', icon: '🧀', domain: 'food', priority: 84 },
        { name: 'Mezeluri', icon: '🥓', domain: 'food', priority: 83 },
        { name: 'Iaurt', icon: '🥣', domain: 'food', priority: 82 },
        { name: 'Ulei / Zahăr', icon: '🧂', domain: 'food', priority: 81 },
        { name: 'Paste / Orez', icon: '🍝', domain: 'food', priority: 80 },
        { name: 'Pește', icon: '🐟', domain: 'food', priority: 79 },
        { name: 'Snacks', icon: '🍿', domain: 'food', priority: 78 },

        // Cumpărături & Haine
        { name: 'Tricou', icon: '👕', domain: 'fashion', priority: 95 },
        { name: 'Pantaloni', icon: '👖', domain: 'fashion', priority: 94 },
        { name: 'Blugi', icon: '👖', domain: 'fashion', priority: 93 },
        { name: 'Cămașă', icon: '👔', domain: 'fashion', priority: 92 },
        { name: 'Rochie', icon: '👗', domain: 'fashion', priority: 91 },
        { name: 'Geacă', icon: '🧥', domain: 'fashion', priority: 90 },
        { name: 'Hanorac', icon: '🧥', domain: 'fashion', priority: 89 },
        { name: 'Pantofi', icon: '👞', domain: 'fashion', priority: 88 },
        { name: 'Adidași', icon: '👟', domain: 'fashion', priority: 87 },
        { name: 'Șosete', icon: '🧦', domain: 'fashion', priority: 86 },
        { name: 'Lenjerie', icon: '🩲', domain: 'fashion', priority: 85 },
        { name: 'Geantă / Rucsac', icon: '👜', domain: 'fashion', priority: 84 },
        { name: 'Curea', icon: '🎗️', domain: 'fashion', priority: 83 },

        // Transport & Combustibil
        { name: 'Benzină', icon: '⛽', domain: 'transport', priority: 95 },
        { name: 'Motorină', icon: '⛽', domain: 'transport', priority: 94 },
        { name: 'GPL', icon: '⛽', domain: 'transport', priority: 92 },
        { name: 'Spălătorie auto', icon: '🚗', domain: 'transport', priority: 90 },
        { name: 'Parcare', icon: '🅿️', domain: 'transport', priority: 88 },
        { name: 'Cursă Uber / Bolt', icon: '🚕', domain: 'transport', priority: 87 },
        { name: 'Bilet STB / Metrou', icon: '🎫', domain: 'transport', priority: 86 },
        { name: 'Bilet tren CFR', icon: '🚆', domain: 'transport', priority: 85 },
        { name: 'Rovinietă', icon: '🛣️', domain: 'transport', priority: 84 },
        { name: 'Revizie / Schimb ulei', icon: '🔧', domain: 'transport', priority: 82 },

        // Sănătate & Farmacie
        { name: 'Medicamente', icon: '💊', domain: 'health', priority: 95 },
        { name: 'Antibiotice', icon: '💊', domain: 'health', priority: 94 },
        { name: 'Vitamine', icon: '💊', domain: 'health', priority: 93 },
        { name: 'Sirop / Răceală', icon: '🧴', domain: 'health', priority: 92 },
        { name: 'Pansamente / Plasturi', icon: '🩹', domain: 'health', priority: 90 },
        { name: 'Analize medicale', icon: '🩸', domain: 'health', priority: 88 },
        { name: 'Consultație medic', icon: '🩺', domain: 'health', priority: 87 },
        { name: 'Stomatolog', icon: '🦷', domain: 'health', priority: 86 },

        // Locuință & Curățenie
        { name: 'Detergent rufe', icon: '🧼', domain: 'home', priority: 95 },
        { name: 'Balsam rufe', icon: '🧴', domain: 'home', priority: 94 },
        { name: 'Detergent vase', icon: '🧼', domain: 'home', priority: 93 },
        { name: 'Soluție curățenie', icon: '🧽', domain: 'home', priority: 92 },
        { name: 'Hârtie igienică', icon: '🧻', domain: 'home', priority: 91 },
        { name: 'Săpun / Gel duș', icon: '🧼', domain: 'home', priority: 90 },
        { name: 'Șampon', icon: '🧴', domain: 'home', priority: 89 },
        { name: 'Pastă dinți', icon: '🪥', domain: 'home', priority: 88 },
        { name: 'Becuri', icon: '💡', domain: 'home', priority: 85 },

        // Facturi, Energie, Utilități, Servicii & Taxe
        { name: 'Curent Electric', icon: '💡', domain: 'utilities', priority: 98 },
        { name: 'Gaze Naturale', icon: '🔥', domain: 'utilities', priority: 97 },
        { name: 'Apă & Canal', icon: '💧', domain: 'utilities', priority: 96 },
        { name: 'Internet & TV', icon: '📶', domain: 'utilities', priority: 95 },
        { name: 'Telefonie Mobilă', icon: '📱', domain: 'utilities', priority: 94 },
        { name: 'Întreținere Bloc', icon: '🏢', domain: 'utilities', priority: 93 },
        { name: 'Chirie Apartament', icon: '🏠', domain: 'utilities', priority: 92 },
        { name: 'Impozit & Taxe', icon: '🏛️', domain: 'utilities', priority: 91 },
        { name: 'Salubritate / Gunoi', icon: '🗑️', domain: 'utilities', priority: 90 },
        { name: 'Asigurare Locuință', icon: '🛡️', domain: 'utilities', priority: 89 },
        { name: 'Rată Bancă / Credit', icon: '💳', domain: 'utilities', priority: 88 }
    ];

    const hidden = (appData && appData.settings && Array.isArray(appData.settings.hiddenShoppingItems))
        ? appData.settings.hiddenShoppingItems.map(h => String(h).toLowerCase().trim())
        : [];

    const itemMap = new Map();
    defaultItems.forEach(item => {
        const key = item.name.toLowerCase().trim();
        if (!hidden.includes(key)) {
            itemMap.set(key, { ...item, count: 0, catCount: 0 });
        }
    });

    // Încărcare articole personalizate din setări
    if (appData && appData.settings && Array.isArray(appData.settings.customShoppingItems)) {
        appData.settings.customShoppingItems.forEach(ci => {
            if (ci && ci.name) {
                const key = ci.name.toLowerCase().trim();
                if (!hidden.includes(key)) {
                    if (!itemMap.has(key)) {
                        itemMap.set(key, {
                            name: ci.name,
                            icon: ci.icon || '🛍️',
                            domain: ci.categoryId ? getCategoryDomain(ci.categoryId) : 'custom',
                            priority: 70,
                            count: 1,
                            catCount: (ci.categoryId === activeCatId ? 5 : 0),
                            isCustom: true,
                            categoryId: ci.categoryId || null
                        });
                    } else {
                        const existing = itemMap.get(key);
                        existing.isCustom = true;
                        if (ci.categoryId === activeCatId) {
                            existing.catCount += 5;
                        }
                    }
                }
            }
        });
    }

    // Colectare din descrierile tranzacțiilor existente
    if (appData && Array.isArray(appData.transactions)) {
        appData.transactions.forEach(t => {
            if (t.type === 'expense') {
                const mc = getTransactionMerchantAndComment(t);
                const desc = (mc.comment || '').trim();
                if (desc) {
                    const key = desc.toLowerCase();
                    if (!hidden.includes(key)) {
                        if (!itemMap.has(key)) {
                            itemMap.set(key, {
                                name: desc,
                                icon: '🛍️',
                                domain: (t.categoryId === activeCatId ? activeDomain : getCategoryDomain(t.categoryId)),
                                priority: 50,
                                count: 1,
                                catCount: (t.categoryId === activeCatId ? 1 : 0),
                                isCustom: true
                            });
                        } else {
                            const item = itemMap.get(key);
                            item.count += 1;
                            if (t.categoryId === activeCatId) {
                                item.catCount += 1;
                            }
                        }
                    }
                }
            }
        });
    }

    // Calcul scor inteligent
    const itemsList = Array.from(itemMap.values());
    itemsList.forEach(item => {
        let score = 0;
        const isDomainMatch = (activeDomain !== 'general' && item.domain === activeDomain);
        const isDirectCatMatch = (item.categoryId && item.categoryId === activeCatId);

        if (item.catCount > 0) {
            score += 10000 + (item.catCount * 250);
        } else if (isDirectCatMatch) {
            score += 5000;
        } else if (isDomainMatch) {
            score += 2000 + (item.priority || 50);
        }

        score += (item.count * 15);
        if (!isDomainMatch && !isDirectCatMatch && item.catCount === 0) {
            score += (item.priority || 10);
        }

        item.smartScore = score;
    });

    itemsList.sort((a, b) => b.smartScore - a.smartScore);
    return itemsList;
}

// Adăugare articol de cumpărături personalizat
function addCustomShoppingItem(name, catId = null) {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (!appData.settings) appData.settings = {};
    if (!Array.isArray(appData.settings.customShoppingItems)) {
        appData.settings.customShoppingItems = [];
    }
    if (Array.isArray(appData.settings.hiddenShoppingItems)) {
        appData.settings.hiddenShoppingItems = appData.settings.hiddenShoppingItems.filter(h => h !== cleanName.toLowerCase());
    }

    const exists = appData.settings.customShoppingItems.some(i => i.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
        appData.settings.customShoppingItems.unshift({
            name: cleanName,
            icon: '🛍️',
            categoryId: catId || null,
            isCustom: true
        });
    }
    saveData();
    persistDatabaseToFile();

    const descInput = document.getElementById('expenseDesc');
    if (descInput) {
        descInput.value = cleanName;
    }

    const activeCatId = catId || document.getElementById('selectedExpenseCategoryId')?.value;
    updateFoodMerchantsQuickPicker(activeCatId);
    showToast(`Articolul "${cleanName}" a fost selectat!`, 'success');
}

// Ștergere articol de cumpărături (personalizat sau din listă)
function deleteCustomShoppingItem(name) {
    if (!name) return;
    const lower = name.toLowerCase().trim();
    if (!appData.settings) appData.settings = {};
    if (!Array.isArray(appData.settings.hiddenShoppingItems)) {
        appData.settings.hiddenShoppingItems = [];
    }
    if (!appData.settings.hiddenShoppingItems.includes(lower)) {
        appData.settings.hiddenShoppingItems.push(lower);
    }
    if (Array.isArray(appData.settings.customShoppingItems)) {
        appData.settings.customShoppingItems = appData.settings.customShoppingItems.filter(i => i.name.toLowerCase().trim() !== lower);
    }

    const descInput = document.getElementById('expenseDesc');
    if (descInput && descInput.value.trim().toLowerCase() === lower) {
        descInput.value = '';
    }

    saveData();
    persistDatabaseToFile();

    const activeCatId = document.getElementById('selectedExpenseCategoryId')?.value;
    updateFoodMerchantsQuickPicker(activeCatId);
    showToast(`Articolul "${name}" a fost eliminat!`, 'info');
}

// Adăugare magazin personalizat cu salvare persistentă pe disc
function addCustomMerchant(name, icon = '🛒', catId = null) {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    if (!appData.settings) appData.settings = {};
    if (!Array.isArray(appData.settings.customMerchants)) {
        appData.settings.customMerchants = [];
    }
    if (Array.isArray(appData.settings.hiddenMerchants)) {
        appData.settings.hiddenMerchants = appData.settings.hiddenMerchants.filter(h => h !== cleanName.toLowerCase());
    }

    const exists = appData.settings.customMerchants.some(m => m.name.toLowerCase() === cleanName.toLowerCase());
    if (!exists) {
        appData.settings.customMerchants.unshift({
            name: cleanName,
            icon: icon || '🛒',
            categoryId: catId || null,
            isCustom: true
        });
    }
    saveData();
    persistDatabaseToFile();

    // Selectăm magazinul în câmpul ascuns pentru formular
    const merchantInput = document.getElementById('selectedExpenseMerchant');
    if (merchantInput) {
        merchantInput.value = cleanName;
    }

    const activeCatId = catId || document.getElementById('selectedExpenseCategoryId')?.value;
    updateFoodMerchantsQuickPicker(activeCatId);
    renderMerchantCatConfigModal();
    showToast(`Magazinul "${cleanName}" a fost adăugat!`, 'success');
}

// Ștergere magazin (personalizat sau din listă)
function deleteCustomMerchant(name) {
    if (!name) return;
    const lower = name.toLowerCase().trim();
    if (!appData.settings) appData.settings = {};
    if (!Array.isArray(appData.settings.hiddenMerchants)) {
        appData.settings.hiddenMerchants = [];
    }
    if (!appData.settings.hiddenMerchants.includes(lower)) {
        appData.settings.hiddenMerchants.push(lower);
    }
    if (Array.isArray(appData.settings.customMerchants)) {
        appData.settings.customMerchants = appData.settings.customMerchants.filter(m => m.name.toLowerCase().trim() !== lower);
    }
    
    // Dacă magazinul șters era cel selectat în formular, îl deselectăm
    const merchantInput = document.getElementById('selectedExpenseMerchant');
    if (merchantInput && merchantInput.value.trim().toLowerCase() === lower) {
        merchantInput.value = '';
    }

    saveData();
    persistDatabaseToFile();

    const activeCatId = document.getElementById('selectedExpenseCategoryId')?.value;
    updateFoodMerchantsQuickPicker(activeCatId);
    renderMerchantCatConfigModal();
    showToast(`Magazinul "${name}" a fost eliminat!`, 'info');
}

// Afișează panoul dual cu cumpărături (stânga) și magazine cu sigle reale (dreapta)
function updateFoodMerchantsQuickPicker(catId, forceOpen = false) {
    const popover = document.getElementById('foodMerchantsFloatingOverlay');
    const storesListEl = document.getElementById('expenseMerchantsFloatingList');
    const itemsListEl = document.getElementById('expenseShoppingItemsFloatingList');
    if (!popover) return;

    if (!catId || !isMerchantEnabledForCategory(catId)) {
        popover.style.display = 'none';
        if (storesListEl) storesListEl.innerHTML = '';
        if (itemsListEl) itemsListEl.innerHTML = '';
        return;
    }

    const stores = getFoodMerchantsList(catId);
    const items = getFoodShoppingItemsList(catId);

    if (forceOpen) {
        popover.style.display = 'flex';
    }

    // 1. Randare Coloana Magazine (Dreapta) cu Sigle Reale & Buton de Ștergere
    if (storesListEl) {
        const merchantInput = document.getElementById('selectedExpenseMerchant');
        const currentMerchant = merchantInput ? merchantInput.value.trim().toLowerCase() : '';

        storesListEl.innerHTML = '';
        stores.forEach(store => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isMatch = currentMerchant && currentMerchant === store.name.toLowerCase();
            btn.className = 'merchant-popover-btn' + (isMatch ? ' active' : '');
            btn.title = store.name;

            const logoHtml = getMerchantLogoHtml(store.name, 16);

            btn.innerHTML = `
                <span class="merchant-btn-name">${logoHtml} <span>${escapeHtml(store.name)}</span></span>
                <span class="merchant-btn-del" title="Șterge magazinul">&times;</span>
            `;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.target && (e.target.classList.contains('merchant-btn-del') || e.target.closest('.merchant-btn-del'))) {
                    e.stopPropagation();
                    deleteCustomMerchant(store.name);
                    return;
                }
                const curSel = merchantInput ? merchantInput.value.trim().toLowerCase() : '';
                if (curSel === store.name.toLowerCase()) {
                    if (merchantInput) merchantInput.value = '';
                    btn.classList.remove('active');
                } else {
                    if (merchantInput) merchantInput.value = store.name;
                    storesListEl.querySelectorAll('.merchant-popover-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });

            storesListEl.appendChild(btn);
        });
    }

    // 2. Randare Coloana Cumpărături / Articole (Stânga) & Buton de Ștergere
    if (itemsListEl) {
        const descInput = document.getElementById('expenseDesc');
        const currentDesc = descInput ? descInput.value.trim().toLowerCase() : '';

        itemsListEl.innerHTML = '';
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isMatch = currentDesc && currentDesc === item.name.toLowerCase();
            btn.className = 'merchant-popover-btn' + (isMatch ? ' active' : '');
            btn.title = item.name;

            const iconHtml = item.icon || '🛍️';

            btn.innerHTML = `
                <span class="merchant-btn-name"><span>${iconHtml}</span> <span>${escapeHtml(item.name)}</span></span>
                <span class="merchant-btn-del" title="Șterge articolul">&times;</span>
            `;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.target && (e.target.classList.contains('merchant-btn-del') || e.target.closest('.merchant-btn-del'))) {
                    e.stopPropagation();
                    deleteCustomShoppingItem(item.name);
                    return;
                }
                const curSel = descInput ? descInput.value.trim().toLowerCase() : '';
                if (curSel === item.name.toLowerCase()) {
                    if (descInput) descInput.value = '';
                    btn.classList.remove('active');
                } else {
                    if (descInput) descInput.value = item.name;
                    itemsListEl.querySelectorAll('.merchant-popover-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });

            itemsListEl.appendChild(btn);
        });
    }

    // 3. Legare buton deschidere adaugare articol (Stânga Jos)
    const btnOpenAddShopping = document.getElementById('btnOpenAddShoppingItemModal');
    if (btnOpenAddShopping && !btnOpenAddShopping.dataset.bound) {
        btnOpenAddShopping.dataset.bound = 'true';
        btnOpenAddShopping.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            openMerchantPrompt('shopping_item');
        });
    }

    // 4. Legare buton deschidere adaugare magazin (Dreapta Jos)
    const btnOpenAddStore = document.getElementById('btnOpenAddMerchantModal');
    if (btnOpenAddStore && !btnOpenAddStore.dataset.bound) {
        btnOpenAddStore.dataset.bound = 'true';
        btnOpenAddStore.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            openMerchantPrompt('merchant');
        });
    }

    // 5. Buton Salvează Selecția din panoul dual
    const btnConfirmSelection = document.getElementById('btnConfirmMerchantAndItemsSelection');
    if (btnConfirmSelection && !btnConfirmSelection.dataset.bound) {
        btnConfirmSelection.dataset.bound = 'true';
        btnConfirmSelection.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            const pop = document.getElementById('foodMerchantsFloatingOverlay');
            if (pop) pop.style.display = 'none';

            const merch = document.getElementById('selectedExpenseMerchant')?.value || '';
            const itemDesc = document.getElementById('expenseDesc')?.value || '';
            if (merch || itemDesc) {
                const summary = [itemDesc, merch].filter(Boolean).join(' @ ');
                showToast(`Selecție salvată: ${summary}`, 'success');
            }
        });
    }

    // 6. Legare acțiuni fereastră prompt adăugare
    const btnClosePrompt = document.getElementById('btnCloseMerchantPrompt');
    if (btnClosePrompt && !btnClosePrompt.dataset.bound) {
        btnClosePrompt.dataset.bound = 'true';
        btnClosePrompt.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            closeAndSaveMerchantPrompt();
        });
    }

    const btnSavePrompt = document.getElementById('btnSaveMerchantPrompt');
    if (btnSavePrompt && !btnSavePrompt.dataset.bound) {
        btnSavePrompt.dataset.bound = 'true';
        btnSavePrompt.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            closeAndSaveMerchantPrompt();
        });
    }

    const btnCancelPrompt = document.getElementById('btnCancelMerchantPrompt');
    if (btnCancelPrompt && !btnCancelPrompt.dataset.bound) {
        btnCancelPrompt.dataset.bound = 'true';
        btnCancelPrompt.addEventListener('click', (e) => {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            const input = document.getElementById('merchantPromptInput');
            if (input) input.value = '';
            const overlay = document.getElementById('merchantItemAddPromptOverlay');
            if (overlay) overlay.style.display = 'none';
        });
    }

    const promptInput = document.getElementById('merchantPromptInput');
    if (promptInput && !promptInput.dataset.bound) {
        promptInput.dataset.bound = 'true';
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                closeAndSaveMerchantPrompt();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                const overlay = document.getElementById('merchantItemAddPromptOverlay');
                if (overlay) overlay.style.display = 'none';
            }
        });
    }

    const promptOverlay = document.getElementById('merchantItemAddPromptOverlay');
    if (promptOverlay && !promptOverlay.dataset.bound) {
        promptOverlay.dataset.bound = 'true';
        promptOverlay.addEventListener('click', (e) => {
            if (e.target === promptOverlay) {
                closeAndSaveMerchantPrompt();
            }
        });
    }
}

let currentMerchantPromptType = 'shopping_item';

function openMerchantPrompt(type) {
    currentMerchantPromptType = type;
    const overlay = document.getElementById('merchantItemAddPromptOverlay');
    const title = document.getElementById('merchantPromptTitle');
    const input = document.getElementById('merchantPromptInput');
    if (!overlay || !input) return;

    if (type === 'shopping_item') {
        if (title) title.textContent = '🛍️ Adaugă Articol Nou';
        input.placeholder = 'Ex: Pâine, Suc, Lapte...';
    } else {
        if (title) title.textContent = '🛒 Adaugă Magazin Nou';
        input.placeholder = 'Ex: eMAG, Penny, Piață...';
    }

    input.value = '';
    overlay.style.display = 'flex';
    setTimeout(() => {
        input.focus();
    }, 60);
}

function closeAndSaveMerchantPrompt() {
    const overlay = document.getElementById('merchantItemAddPromptOverlay');
    const input = document.getElementById('merchantPromptInput');
    if (!overlay) return;

    const val = (input ? input.value : '').trim();
    if (val) {
        const curCat = document.getElementById('selectedExpenseCategoryId')?.value;
        if (currentMerchantPromptType === 'shopping_item') {
            addCustomShoppingItem(val, curCat);
        } else {
            addCustomMerchant(val, '🛒', curCat);
        }
    }
    if (input) input.value = '';
    overlay.style.display = 'none';
}

// Fereastra de configurare: La care carduri apare lista de magazine
function renderMerchantCatConfigModal() {
    const listEl = document.getElementById('merchantCatConfigList');
    if (!listEl) return;

    if (!appData.settings) appData.settings = {};
    if (!Array.isArray(appData.settings.merchantEnabledCategoryIds)) {
        appData.settings.merchantEnabledCategoryIds = appData.categories.map(c => c.id);
    }

    listEl.innerHTML = '';
    appData.categories.forEach(cat => {
        const isChecked = appData.settings.merchantEnabledCategoryIds.includes(cat.id);
        const item = document.createElement('label');
        item.className = 'merchant-cat-config-item';
        item.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.1rem;">${cat.icon || '🏷️'}</span>
                <span style="color:${cat.color}; font-weight:700;">${escapeHtml(cat.name)}</span>
            </div>
            <input type="checkbox" style="width:18px; height:18px; accent-color:var(--accent); cursor:pointer;" ${isChecked ? 'checked' : ''} data-catid="${cat.id}">
        `;

        item.querySelector('input').addEventListener('change', (e) => {
            const checked = e.target.checked;
            const id = cat.id;
            if (checked) {
                if (!appData.settings.merchantEnabledCategoryIds.includes(id)) {
                    appData.settings.merchantEnabledCategoryIds.push(id);
                }
            } else {
                appData.settings.merchantEnabledCategoryIds = appData.settings.merchantEnabledCategoryIds.filter(cid => cid !== id);
            }
            saveData();
            const activeExpenseCatId = document.getElementById('selectedExpenseCategoryId')?.value;
            updateFoodMerchantsQuickPicker(activeExpenseCatId);
        });

        listEl.appendChild(item);
    });

    // Populare listă etichete magazine personalizate în modal
    const customListEl = document.getElementById('merchantCustomListContainer');
    if (customListEl) {
        customListEl.innerHTML = '';
        const customMerchants = (appData.settings && Array.isArray(appData.settings.customMerchants)) ? appData.settings.customMerchants : [];
        if (customMerchants.length === 0) {
            customListEl.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Niciun magazin personalizat adăugat încă.</span>';
        } else {
            customMerchants.forEach(m => {
                const tag = document.createElement('div');
                tag.className = 'merchant-custom-tag';
                tag.innerHTML = `<span style="display:inline-flex;align-items:center;gap:5px;">${getMerchantLogoHtml(m.name, 16)} <span>${escapeHtml(m.name)}</span></span><span class="merchant-tag-del" title="Șterge">&times;</span>`;
                tag.querySelector('.merchant-tag-del').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteCustomMerchant(m.name);
                });
                customListEl.appendChild(tag);
            });
        }
    }
}

// Reordonare categorii prin Drag & Drop (memorare persistentă pe disc și în memorie)
function reorderCategories(sourceCatId, targetCatId) {
    if (!sourceCatId || !targetCatId || sourceCatId === targetCatId) return false;
    const srcIdx = appData.categories.findIndex(c => c.id === sourceCatId);
    const dstIdx = appData.categories.findIndex(c => c.id === targetCatId);
    if (srcIdx === -1 || dstIdx === -1) return false;

    const [movedCat] = appData.categories.splice(srcIdx, 1);
    appData.categories.splice(dstIdx, 0, movedCat);

    saveData();
    persistDatabaseToFile();
    return true;
}

let draggedCategoryId = null;

// Render Category Picker in "Add Expense" Modal (4 coloane cu suport complet Drag & Drop pe Touch și Mouse)
function renderExpenseCategoryPicker() {
    const grid = document.getElementById('expenseCategoryPicker');
    if (!grid) return;
    grid.innerHTML = '';

    const selectedHidden = document.getElementById('selectedExpenseCategoryId');
    const currentSelectedId = selectedHidden.value;
    let firstId = null;

    appData.categories.forEach((cat, index) => {
        if (index === 0) firstId = cat.id;
        const isSelected = currentSelectedId ? (cat.id === currentSelectedId) : false;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat-pick-btn' + (isSelected ? ' active' : '');
        btn.dataset.id = cat.id;
        btn.title = `${cat.name} (Ține apăsat și trage pentru a rearanja)`;
        btn.draggable = true;
        btn.innerHTML = `
            <div class="cat-pick-icon-wrap">
                <span class="cat-pick-dot" style="background-color: ${cat.color};"></span>
                <span class="cat-pick-icon">${cat.icon || '🏷️'}</span>
            </div>
            <span class="cat-pick-name">${escapeHtml(cat.name)}</span>
        `;

        // === Desktop Drag & Drop (HTML5) ===
        btn.addEventListener('dragstart', (e) => {
            draggedCategoryId = cat.id;
            e.dataTransfer.setData('text/plain', cat.id);
            e.dataTransfer.effectAllowed = 'move';
            btn.classList.add('dragging');
        });

        btn.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        btn.addEventListener('dragenter', () => {
            if (draggedCategoryId && draggedCategoryId !== cat.id) {
                btn.classList.add('drag-over');
            }
        });

        btn.addEventListener('dragleave', () => {
            btn.classList.remove('drag-over');
        });

        btn.addEventListener('dragend', () => {
            draggedCategoryId = null;
            document.querySelectorAll('#expenseCategoryPicker .cat-pick-btn').forEach(b => {
                b.classList.remove('dragging');
                b.classList.remove('drag-over');
            });
        });

        btn.addEventListener('drop', (e) => {
            e.preventDefault();
            btn.classList.remove('drag-over');
            const sourceId = e.dataTransfer.getData('text/plain') || draggedCategoryId;
            draggedCategoryId = null;
            if (sourceId && sourceId !== cat.id) {
                if (reorderCategories(sourceId, cat.id)) {
                    renderExpenseCategoryPicker();
                    renderCategoriesManager();
                    renderOverviewChartAndList();
                    showToast('Poziția categoriei a fost salvată!', 'info');
                }
            }
        });

        // === Mobile Touch Drag & Drop (Ecran tactil cu Hold lung de 380ms) ===
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchDragging = false;
        let touchMoved = false;
        let targetDropBtn = null;
        let dragTimer = null;

        btn.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isTouchDragging = false;
            touchMoved = false;
            targetDropBtn = null;

            btn.classList.add('holding');

            // Timer de drag hold (380ms de apăsare nemișcată pe card)
            dragTimer = setTimeout(() => {
                btn.classList.remove('holding');
                isTouchDragging = true;
                btn.classList.add('dragging');
                if (navigator.vibrate) {
                    try { navigator.vibrate(30); } catch(err) {}
                }
            }, 380);
        }, { passive: true });

        btn.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            const curX = e.touches[0].clientX;
            const curY = e.touches[0].clientY;
            const diffX = curX - touchStartX;
            const diffY = curY - touchStartY;
            const dist = Math.hypot(diffX, diffY);

            // Dacă utilizatorul a mișcat degetul înainte de finalizarea hold-ului de 380ms -> E SCROLL normal!
            if (!isTouchDragging) {
                if (dist > 8) {
                    clearTimeout(dragTimer);
                    btn.classList.remove('holding');
                    touchMoved = true;
                }
                return; // Lăsăm containerul / pagina să facă scroll natural!
            }

            // Aici suntem în mod Drag & Drop confirmat (după hold de 380ms)
            touchMoved = true;
            if (e.cancelable) e.preventDefault();
            const elemUnder = document.elementFromPoint(curX, curY);
            const hoverBtn = elemUnder ? elemUnder.closest('#expenseCategoryPicker .cat-pick-btn') : null;
            
            document.querySelectorAll('#expenseCategoryPicker .cat-pick-btn').forEach(b => {
                if (b !== hoverBtn) b.classList.remove('drag-over');
            });

            if (hoverBtn && hoverBtn !== btn) {
                hoverBtn.classList.add('drag-over');
                targetDropBtn = hoverBtn;
            } else {
                targetDropBtn = null;
            }
        }, { passive: false });

        btn.addEventListener('touchend', () => {
            clearTimeout(dragTimer);
            btn.classList.remove('holding');
            btn.classList.remove('dragging');
            document.querySelectorAll('#expenseCategoryPicker .cat-pick-btn').forEach(b => b.classList.remove('drag-over'));

            if (isTouchDragging && targetDropBtn && targetDropBtn !== btn) {
                const targetId = targetDropBtn.dataset.id;
                if (targetId && targetId !== cat.id) {
                    if (reorderCategories(cat.id, targetId)) {
                        renderExpenseCategoryPicker();
                        renderCategoriesManager();
                        renderOverviewChartAndList();
                        showToast('Poziția categoriei a fost salvată!', 'info');
                    }
                }
            } else if (!touchMoved && !isTouchDragging) {
                // Click / Tap normal (selectare categorie)
                document.querySelectorAll('#expenseCategoryPicker .cat-pick-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedHidden.value = cat.id;
                updateFoodMerchantsQuickPicker(cat.id, true);
            }
            isTouchDragging = false;
            targetDropBtn = null;
        });

        btn.addEventListener('touchcancel', () => {
            clearTimeout(dragTimer);
            btn.classList.remove('holding');
            btn.classList.remove('dragging');
            document.querySelectorAll('#expenseCategoryPicker .cat-pick-btn').forEach(b => b.classList.remove('drag-over'));
            isTouchDragging = false;
            targetDropBtn = null;
        });

        // Click simplu pentru Mouse desktop
        btn.addEventListener('click', (e) => {
            if (touchMoved) return;
            document.querySelectorAll('#expenseCategoryPicker .cat-pick-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedHidden.value = cat.id;
            updateFoodMerchantsQuickPicker(cat.id, true);
        });

        grid.appendChild(btn);
    });

    if (selectedHidden && selectedHidden.value) {
        updateFoodMerchantsQuickPicker(selectedHidden.value, false);
    } else {
        const popover = document.getElementById('foodMerchantsFloatingOverlay');
        if (popover) popover.style.display = 'none';
    }
}

// Preset Colors in Category Edit Modal
function renderColorPresets() {
    const palette = document.getElementById('colorPresetPalette');
    if (!palette) return;
    palette.innerHTML = '';
    const currentColor = (document.getElementById('categoryColorPicker')?.value || '').toLowerCase();

    PRESET_COLORS.forEach(color => {
        const dot = document.createElement('div');
        const isActive = (color.toLowerCase() === currentColor);
        dot.className = 'color-circle' + (isActive ? ' active' : '');
        dot.style.backgroundColor = color;
        dot.title = color;
        dot.addEventListener('click', () => {
            document.getElementById('categoryColorPicker').value = color;
            document.getElementById('categoryColorCode').textContent = color;
            document.querySelectorAll('.color-circle').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
        palette.appendChild(dot);
    });
}

// Open Modal Helper
function openModal(modalId) {
    applyLanguage();
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.scrollTop = 0;
        const box = modal.querySelector('.modal-box');
        if (box) box.scrollTop = 0;
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        modal.classList.add('active');
    }
}

// Close Modal Helper
function closeModal(modalId) {
    if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    } else {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
    if (!document.querySelector('.modal-overlay.active')) {
        document.body.classList.remove('modal-open');
    }
}

// Render Currency Picker Modal (Activat cand utilizatorul apasa pe indicatorul monedei in antet)
function renderCurrencyPickerModal() {
    const container = document.getElementById('currencyListContainer');
    if (!container) return;
    container.innerHTML = '';

    applyLanguage();

    const activeCurr = getActiveCurrency();
    const activeLang = getLanguageForCurrency();

    WORLD_CURRENCIES.forEach(curr => {
        const info = getCurrencyInfo(curr.code);
        const isActive = info.code === activeCurr;
        const localizedName = getLocalizedCurrencyName(info.code, activeLang);

        let rateDesc = '';
        if (info.code === 'RON') {
            rateDesc = `${t('currency_ref_label', activeLang)} (1.00)`;
        } else if (info.rateToRon < 0.1) {
            const unitRon = activeLang === 'ro' ? 'lei' : 'RON';
            rateDesc = `1 ${info.code} = ${info.rateToRon.toFixed(3)} ${unitRon} (100 ${info.code} = ${(info.rateToRon * 100).toFixed(2)} ${unitRon})`;
        } else {
            const unitRon = activeLang === 'ro' ? 'lei' : 'RON';
            rateDesc = `1 ${info.code} = ${info.rateToRon.toFixed(2)} ${unitRon}`;
        }

        const card = document.createElement('div');
        card.className = 'currency-card-item' + (isActive ? ' active' : '');
        card.dataset.currency = info.code;

        card.innerHTML = `
            <div class="currency-card-left">
                <div class="currency-flag-badge">${info.flag}</div>
                <div>
                    <div class="currency-card-title">${localizedName} (${info.code})</div>
                    <div class="currency-card-sub">${rateDesc}</div>
                </div>
            </div>
            <div class="currency-card-right">
                ${isActive ? `<span class="currency-active-pill">${t('currency_active_badge', activeLang)}</span>` : `<span class="currency-rate-text">${info.symbol}</span>`}
            </div>
        `;

        card.addEventListener('click', () => {
            setMainCurrency(info.code);
        });

        container.appendChild(card);
    });
}

// ==========================================
// PRELUARE CURSURI LIVE DE PE INTERNET (BCE / OPEN-ER API)
// ==========================================
let isFetchingRates = false;

async function fetchLiveExchangeRates(manual = false) {
    if (isFetchingRates) return false;
    isFetchingRates = true;

    const refreshBtn = document.getElementById('btnRefreshRates');
    if (refreshBtn && manual) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch('https://open.er-api.com/v6/latest/RON', {
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Status: ' + res.status);
        const data = await res.json();
        if (data && data.result === 'success' && data.rates) {
            const newRatesToRon = { 'RON': 1.00 };
            WORLD_CURRENCIES.forEach(c => {
                if (c.code === 'RON') return;
                if (data.rates[c.code] && data.rates[c.code] > 0) {
                    newRatesToRon[c.code] = parseFloat((1 / data.rates[c.code]).toFixed(4));
                }
            });

            if (!appData.settings) appData.settings = {};
            appData.settings.exchangeRates = {
                lastUpdated: new Date().toISOString(),
                ratesToRon: newRatesToRon
            };
            if (newRatesToRon['EUR']) {
                appData.settings.eurRate = newRatesToRon['EUR'];
            }
            saveData();

            updateConverterStatusDisplay();
            renderCurrencyConverter();
            updateBalanceCards();
            renderOverviewChartAndList();

            if (manual) {
                showToast(t('rates_updated_toast'), 'success');
            }
            console.log('MoneyApp: Cursuri valutare live actualizate cu succes de la BCE / OpenER:', newRatesToRon);
            return true;
        }
    } catch (err) {
        console.log('MoneyApp: Cursuri live indisponibile offline:', err.message);
        if (manual) {
            showToast(t('rates_offline_toast'), 'info');
        }
        updateConverterStatusDisplay();
        return false;
    } finally {
        isFetchingRates = false;
        if (refreshBtn && manual) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

function updateConverterStatusDisplay() {
    const timeEl = document.getElementById('convRatesLastUpdated');
    if (!timeEl) return;
    const activeLang = getLanguageForCurrency();
    if (appData.settings && appData.settings.exchangeRates && appData.settings.exchangeRates.lastUpdated) {
        try {
            const d = new Date(appData.settings.exchangeRates.lastUpdated);
            const timeStr = d.toLocaleDateString(activeLang === 'ro' ? 'ro-RO' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            timeEl.textContent = `${t('rates_updated_at', activeLang)}: ${timeStr}`;
            return;
        } catch (e) {}
    }
    timeEl.textContent = activeLang === 'ro' ? 'Actualizat automat (BCE)' : 'Auto-updated (ECB)';
}

// Render Currency Converter Modal (Deschis la apasarea pe Setari Valuta in antet)
function renderCurrencyConverter() {
    applyLanguage();

    const activeCurr = getActiveCurrency();
    const activeLang = getLanguageForCurrency();
    const activeInfo = getCurrencyInfo(activeCurr);
    const localizedActiveName = getLocalizedCurrencyName(activeCurr, activeLang);

    updateConverterStatusDisplay();

    // Afiseaza sectiunea de ajustare manuala EUR/RON DOAR cand moneda principala este RON!
    const manualEurBox = document.getElementById('detailsManualRateEur');
    if (manualEurBox) {
        manualEurBox.style.display = activeCurr === 'RON' ? 'block' : 'none';
        const eurInput = document.getElementById('settingEurRate');
        if (eurInput) eurInput.value = activeInfo.rateToRon || 4.98;
    }

    const flagEl = document.getElementById('converterActiveFlag');
    const codeEl = document.getElementById('converterActiveCode');
    const symEl = document.getElementById('converterAmountCurrencySymbol');
    if (flagEl) flagEl.textContent = activeInfo.flag;
    if (codeEl) {
        codeEl.textContent = activeInfo.code;
        const badgeParent = document.getElementById('converterActiveBadge');
        if (badgeParent) badgeParent.title = `${localizedActiveName} (${activeInfo.code})`;
    }
    if (symEl) symEl.textContent = activeInfo.symbol || activeInfo.code;

    // Actualizare valoare sold disponibil in Chenar 2
    const balValEl = document.getElementById('convBalanceValue');
    if (balValEl) {
        let totalIncomeRon = 0;
        let totalExpenseRon = 0;
        appData.transactions.forEach(t => {
            if (isTxSuspended(t)) return;
            const a = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
            if (t.type === 'income') totalIncomeRon += a;
            else if (t.type === 'expense') totalExpenseRon += a;
        });
        const balActive = Math.max(0, convertFromRon(totalIncomeRon - totalExpenseRon, activeCurr));
        balValEl.textContent = formatMoney(balActive, activeCurr);
    }

    const amtInput = document.getElementById('converterAmountInput');
    let amount = parseFloat(amtInput ? amtInput.value : 100);
    if (isNaN(amount) || amount < 0) amount = 0;

    // Convertim suma din moneda implicita activa in baza RON
    const amountInRon = convertToRon(amount, activeCurr);

    const container = document.getElementById('converterResultsList');
    if (!container) return;
    container.innerHTML = '';

    // Toate celelalte monede din aplicatie
    const otherCurrencies = WORLD_CURRENCIES.filter(c => c.code !== activeCurr);

    const countEl = document.getElementById('converterResultsCount');
    if (countEl) countEl.textContent = `${otherCurrencies.length} ${t('conv_active_count', activeLang)}`;

    otherCurrencies.forEach(info => {
        let targetRateToRon = info.rateToRon;
        if (info.code === 'EUR' && appData.settings && appData.settings.eurRate) {
            targetRateToRon = parseFloat(appData.settings.eurRate) || 4.98;
        }

        // Valoarea convertita in moneda tinta
        const convertedVal = convertFromRon(amountInRon, info.code);
        const formattedVal = formatMoney(convertedVal, info.code);

        // Curs de schimb relativ direct (1 Moneda Implicita = ? Moneda Tinta)
        const baseRate = activeInfo.rateToRon || 1.00;
        const targetRate = targetRateToRon || 1.00;
        const directRate = baseRate / targetRate;

        let rateStr = '';
        if (directRate >= 1) {
            rateStr = `1 ${activeCurr} = ${directRate.toFixed(2)} ${info.code}`;
        } else if (directRate >= 0.01) {
            rateStr = `1 ${activeCurr} = ${directRate.toFixed(4)} ${info.code}`;
        } else {
            rateStr = `1 ${info.code} = ${(1 / directRate).toFixed(2)} ${activeCurr}`;
        }

        const localizedTargetName = getLocalizedCurrencyName(info.code, activeLang);

        const row = document.createElement('div');
        row.className = 'converter-result-row';
        row.innerHTML = `
            <div class="converter-result-left">
                <div class="converter-result-flag">${info.flag}</div>
                <div>
                    <div class="converter-result-name">${localizedTargetName} (${info.code})</div>
                    <div class="converter-result-rate">${rateStr}</div>
                </div>
            </div>
            <div class="converter-result-val">${formattedVal}</div>
        `;
        container.appendChild(row);
    });
}

function setMainCurrency(newCurrency) {
    if (!appData.settings) appData.settings = {};
    appData.settings.mainCurrency = newCurrency;
    window.appData = appData;
    saveData();

    // Actualizare indicator M in antet
    const ind = document.getElementById('logoCurrencyIndicator');
    if (ind) ind.textContent = newCurrency;

    // Aplicare automata limba corespunzatoare monedei alese
    applyLanguage();

    closeModal('modalCurrencyPicker');

    // Recalculare si randare completa a aplicatiei
    updateBalanceCards();
    renderOverviewChartAndList();
    renderTransactionsHistory();
    renderStatsTab();
    renderCategoriesManager();

    const curInfo = getCurrencyInfo(newCurrency);
    const lang = getLanguageForCurrency(newCurrency);
    const toastMsg = lang === 'en'
        ? `Currency changed to ${curInfo.name} (${curInfo.symbol})! Interface translated to English.`
        : (lang === 'de'
            ? `Währung auf ${curInfo.name} (${curInfo.symbol}) geändert! Oberfläche auf Deutsch übersetzt.`
            : (lang === 'tr'
                ? `Para birimi ${curInfo.name} (${curInfo.symbol}) olarak güncellendi! Dil Türkçe yapıldı.`
                : (lang === 'ja'
                    ? `通貨が ${curInfo.name} (${curInfo.symbol}) に変更され、日本語に設定されました。`
                    : (lang === 'zh'
                        ? `货币已切换至 ${curInfo.name} (${curInfo.symbol})，界面已切换为中文。`
                        : `Moneda aplicației a fost schimbată în ${curInfo.name} (${curInfo.symbol})! Interfața este acum în limba română.`))));

    showToast(toastMsg, 'success');
}

// Modal pentru alegerea monedei de conversie a Fondului Disponibil
function openFundCurrencyPickerModal() {
    const container = document.getElementById('fundCurrencyListContainer');
    if (!container) return;

    const mainCurr = getActiveCurrency();
    const activeLang = getLanguageForCurrency();
    const currentConv = appData.settings?.fundConversionCurrency || (mainCurr === 'RON' ? 'EUR' : 'RON');

    container.innerHTML = '';

    // Opțiunea Fără conversie
    const isNone = currentConv === 'none';
    const noneCard = document.createElement('div');
    noneCard.className = 'currency-card-item' + (isNone ? ' active' : '');
    noneCard.innerHTML = `
        <div class="currency-card-left">
            <div class="currency-flag-badge">🚫</div>
            <div>
                <div class="currency-card-title">${t('fund_curr_none', activeLang)}</div>
                <div class="currency-card-sub">${t('fund_curr_none_desc', activeLang)}</div>
            </div>
        </div>
        <div class="currency-card-right">
            ${isNone ? `<span class="currency-active-pill">${t('badge_active', activeLang)}</span>` : `<span class="currency-rate-text">✕</span>`}
        </div>
    `;
    noneCard.onclick = () => {
        if (!appData.settings) appData.settings = {};
        appData.settings.fundConversionCurrency = 'none';
        saveData();
        persistDatabaseToFile();
        closeModal('modalFundCurrencyPicker');
        updateBalanceCards();
        showToast(t('toast_fund_curr_disabled', activeLang), 'info');
    };
    container.appendChild(noneCard);

    WORLD_CURRENCIES.forEach(curr => {
        const info = getCurrencyInfo(curr.code);
        const isActive = info.code === currentConv;
        const localizedName = getLocalizedCurrencyName(info.code, activeLang);

        let rateDesc = '';
        if (info.code === 'RON') {
            rateDesc = `1.00 RON`;
        } else {
            const unitRon = activeLang === 'ro' ? 'lei' : 'RON';
            rateDesc = `1 ${info.code} = ${info.rateToRon.toFixed(2)} ${unitRon}`;
        }

        const card = document.createElement('div');
        card.className = 'currency-card-item' + (isActive ? ' active' : '');
        card.innerHTML = `
            <div class="currency-card-left">
                <div class="currency-flag-badge">${info.flag}</div>
                <div>
                    <div class="currency-card-title">${localizedName} (${info.code})</div>
                    <div class="currency-card-sub">${rateDesc}</div>
                </div>
            </div>
            <div class="currency-card-right">
                ${isActive ? `<span class="currency-active-pill">${t('badge_active', activeLang)}</span>` : `<span class="currency-rate-text">${info.symbol}</span>`}
            </div>
        `;

        card.addEventListener('click', () => {
            if (!appData.settings) appData.settings = {};
            appData.settings.fundConversionCurrency = info.code;
            saveData();
            persistDatabaseToFile();
            closeModal('modalFundCurrencyPicker');
            updateBalanceCards();
            showToast(`${t('toast_fund_curr_set', activeLang)} ${info.code} (${info.symbol})`, 'success');
        });

        container.appendChild(card);
    });

    openModal('modalFundCurrencyPicker');
}

function openTotalsSummaryModal() {
    const container = document.getElementById('totalsSummaryListContainer');
    if (!container) return;

    const mainCurr = getActiveCurrency();
    const activeLang = getLanguageForCurrency();

    // Calcul date specifice venituri & cheltuieli
    let totalIncomeRon = 0;
    let totalExpenseRon = 0;
    let cardIncomeRon = 0;
    let cardExpenseRon = 0;
    let cashIncomeRon = 0;
    let cashExpenseRon = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    let activeTxCount = 0;

    appData.transactions.forEach(tx => {
        if (isTxSuspended(tx)) return;
        const amtRon = parseFloat(tx.amountInRon) || parseFloat(tx.amount) || 0;
        const method = (tx.paymentMethod === 'cash') ? 'cash' : 'card';
        activeTxCount++;
        if (tx.type === 'income') {
            incomeCount++;
            totalIncomeRon += amtRon;
            if (method === 'cash') cashIncomeRon += amtRon;
            else cardIncomeRon += amtRon;
        } else if (tx.type === 'expense') {
            expenseCount++;
            totalExpenseRon += amtRon;
            if (method === 'cash') cashExpenseRon += amtRon;
            else cardExpenseRon += amtRon;
        } else if (tx.type === 'transfer') {
            const dir = tx.transferDirection || 'card-to-cash';
            if (dir === 'card-to-cash') {
                cardExpenseRon += amtRon;
                cashIncomeRon += amtRon;
            } else if (dir === 'cash-to-card') {
                cashExpenseRon += amtRon;
                cardIncomeRon += amtRon;
            }
        }
    });

    const netBalanceRon = totalIncomeRon - totalExpenseRon;
    const cardBalanceRon = cardIncomeRon - cardExpenseRon;
    const cashBalanceRon = cashIncomeRon - cashExpenseRon;

    const displayIncome = convertFromRon(totalIncomeRon, mainCurr);
    const displayExpense = convertFromRon(totalExpenseRon, mainCurr);
    const displayBalance = convertFromRon(netBalanceRon, mainCurr);
    const displayCardIncome = convertFromRon(cardIncomeRon, mainCurr);
    const displayCashIncome = convertFromRon(cashIncomeRon, mainCurr);
    const displayCardExpense = convertFromRon(cardExpenseRon, mainCurr);
    const displayCashExpense = convertFromRon(cashExpenseRon, mainCurr);
    const displayCard = convertFromRon(cardBalanceRon, mainCurr);
    const displayCash = convertFromRon(cashBalanceRon, mainCurr);

    let savingsRate = 0;
    if (totalIncomeRon > 0) {
        savingsRate = Math.max(0, Math.round(((totalIncomeRon - totalExpenseRon) / totalIncomeRon) * 100));
    }

    container.innerHTML = '';

    // 1. Total Venituri Card
    const incomeCard = document.createElement('div');
    incomeCard.className = 'currency-card-item';
    incomeCard.style.cursor = 'default';
    incomeCard.innerHTML = `
        <div class="currency-card-left">
            <div class="currency-flag-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">📈</div>
            <div>
                <div class="currency-card-title">${t('totals_card_income', activeLang)}</div>
                <div class="currency-card-sub">💳 ${formatMoney(displayCardIncome, mainCurr)} • 💵 ${formatMoney(displayCashIncome, mainCurr)}</div>
            </div>
        </div>
        <div class="currency-card-right">
            <span style="font-weight: 800; color: #10b981; font-size: 0.96rem;">+${formatMoney(displayIncome, mainCurr)}</span>
        </div>
    `;
    container.appendChild(incomeCard);

    // 2. Total Cheltuieli Card
    const expenseCard = document.createElement('div');
    expenseCard.className = 'currency-card-item';
    expenseCard.style.cursor = 'default';
    expenseCard.innerHTML = `
        <div class="currency-card-left">
            <div class="currency-flag-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">📉</div>
            <div>
                <div class="currency-card-title">${t('totals_card_expense', activeLang)}</div>
                <div class="currency-card-sub">💳 ${formatMoney(displayCardExpense, mainCurr)} • 💵 ${formatMoney(displayCashExpense, mainCurr)}</div>
            </div>
        </div>
        <div class="currency-card-right">
            <span style="font-weight: 800; color: #ef4444; font-size: 0.96rem;">-${formatMoney(displayExpense, mainCurr)}</span>
        </div>
    `;
    container.appendChild(expenseCard);

    // 3. Fond Disponibil Net
    const balanceCard = document.createElement('div');
    balanceCard.className = 'currency-card-item';
    balanceCard.style.cursor = 'default';
    balanceCard.innerHTML = `
        <div class="currency-card-left">
            <div class="currency-flag-badge" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">💰</div>
            <div>
                <div class="currency-card-title">${t('totals_card_net_balance', activeLang)}</div>
                <div class="currency-card-sub">💳 ${formatMoney(displayCard, mainCurr)} • 💵 ${formatMoney(displayCash, mainCurr)}</div>
            </div>
        </div>
        <div class="currency-card-right">
            <span style="font-weight: 800; color: ${displayBalance >= 0 ? '#10b981' : '#ef4444'}; font-size: 0.96rem;">${formatMoney(displayBalance, mainCurr)}</span>
        </div>
    `;
    container.appendChild(balanceCard);

    // 4. Rată Economisire & Activitate
    const statsCard = document.createElement('div');
    statsCard.className = 'currency-card-item';
    statsCard.style.cursor = 'default';
    statsCard.innerHTML = `
        <div class="currency-card-left">
            <div class="currency-flag-badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">📊</div>
            <div>
                <div class="currency-card-title">${t('totals_card_savings_rate', activeLang)}</div>
                <div class="currency-card-sub">${activeTxCount} ${t('totals_card_tx_count', activeLang)} (${incomeCount} 📈, ${expenseCount} 📉)</div>
            </div>
        </div>
        <div class="currency-card-right">
            <span class="currency-active-pill" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6; font-weight: 800; font-size: 0.84rem;">${savingsRate}%</span>
        </div>
    `;
    container.appendChild(statsCard);

    openModal('modalTotalsSummary');
}

// Open Category Form for Add/Edit
function openCategoryEditModal(catToEdit = null) {
    const idInput = document.getElementById('editCategoryId');
    const nameInput = document.getElementById('categoryNameInput');
    const iconInput = document.getElementById('categoryIconInput');
    const colorPicker = document.getElementById('categoryColorPicker');
    const colorCode = document.getElementById('categoryColorCode');
    const title = document.getElementById('categoryFormModalTitle');

    if (catToEdit) {
        idInput.value = catToEdit.id;
        nameInput.value = catToEdit.name;
        iconInput.value = catToEdit.icon || '🏷️';
        colorPicker.value = catToEdit.color;
        colorCode.textContent = catToEdit.color;
        title.textContent = t('modal_edit_category');
    } else {
        idInput.value = '';
        nameInput.value = '';
        iconInput.value = '🏷️';
        const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
        colorPicker.value = randomColor;
        colorCode.textContent = randomColor;
        title.textContent = t('modal_add_category');
    }

    renderColorPresets();
    openModal('modalCategoryForm');
}

// Helper: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Asigurare aliniere perfecta sus la fiecare deschidere
function ensureTopAlignment() {
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const cont = document.querySelector('.container');
    if (cont) cont.scrollTop = 0;
}

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
ensureTopAlignment();

// Init Setup & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    ensureTopAlignment();
    loadData();
    updateAppVersionBadge();
    updateSecondaryCurrencyDisplay();
    updateSuspendedTxBadge();
    applyTheme(appData.settings.theme);
    updateBalanceCards();
    renderExpenseCategoryPicker();
    renderOverviewChartAndList();

    const curr = getActiveCurrency();
    const ind = document.getElementById('logoCurrencyIndicator');
    if (ind) ind.textContent = curr;
    applyLanguage();

    // Verificare si actualizare automata cursuri valutare de pe net (BCE / OpenER)
    const shouldFetchRates = !appData.settings || !appData.settings.exchangeRates || !appData.settings.exchangeRates.lastUpdated || (Date.now() - new Date(appData.settings.exchangeRates.lastUpdated).getTime() > 6 * 3600 * 1000);
    if (shouldFetchRates) {
        setTimeout(() => fetchLiveExchangeRates(false), 800);
    }

    setTimeout(ensureTopAlignment, 50);

    window.addEventListener('load', ensureTopAlignment);
    window.addEventListener('pageshow', ensureTopAlignment);
    window.addEventListener('orientationchange', () => setTimeout(ensureTopAlignment, 100));

    // Tab Navigation History Stack
    let tabHistory = ['tab-overview'];
    let lastExitAttemptTime = 0;

    // Tab Navigation (Universal: Portret & Landscape Dropdown)
    function switchTab(targetTab, pushHistory = true) {
        if (pushHistory) {
            if (tabHistory.length === 0 || tabHistory[tabHistory.length - 1] !== targetTab) {
                tabHistory.push(targetTab);
                if (tabHistory.length > 20) tabHistory.shift();
            }
        }

        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === targetTab);
        });
        document.querySelectorAll('.landscape-menu-item').forEach(m => {
            m.classList.toggle('active', m.dataset.tab === targetTab);
        });
        document.querySelectorAll('.logo-menu-item').forEach(m => {
            m.classList.toggle('active', m.dataset.tab === targetTab);
        });

        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.remove('active');
            c.style.display = '';
        });

        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
            targetContent.classList.add('active');
            targetContent.style.display = '';
        }

        // Actualizare eticheta buton meniu landscape si subtitlu
        const curInfo = getCurrencyInfo();
        const lang = getLanguageForCurrency();
        const tabInfo = {
            'tab-overview': { name: t('tab_overview', lang), icon: '📊', subtitle: `${t('currency_label', lang)}: ${curInfo.name} (${curInfo.symbol})` },
            'tab-transactions': { name: t('tab_transactions', lang), icon: '📜', subtitle: t('history_title', lang) },
            'tab-stats': { name: t('tab_stats', lang), icon: '📈', subtitle: t('reports_title', lang) },
            'tab-categories': { name: t('tab_categories', lang), icon: '🏷️', subtitle: t('categories_title', lang) }
        };
        if (tabInfo[targetTab]) {
            const titleEl = document.getElementById('landscapeActiveTabTitle');
            const iconEl = document.getElementById('landscapeActiveTabIcon');
            const subtitleEl = document.getElementById('activeSectionSubtitle');
            if (titleEl) titleEl.textContent = tabInfo[targetTab].name;
            if (iconEl) iconEl.textContent = tabInfo[targetTab].icon;
            if (subtitleEl) subtitleEl.textContent = tabInfo[targetTab].subtitle;
        }

        // Inchide meniurile dropdown daca erau deschise
        const menu = document.getElementById('landscapeNavMenu');
        if (menu) menu.classList.remove('show');
        const logoMenu = document.getElementById('logoNavMenu');
        if (logoMenu) logoMenu.classList.remove('show');

        // Tab-specific refreshes
        if (targetTab === 'tab-overview') {
            renderOverviewChartAndList();
        } else if (targetTab === 'tab-transactions') {
            renderTransactionsHistory();
        } else if (targetTab === 'tab-stats') {
            renderStatsTab();
        } else if (targetTab === 'tab-categories') {
            renderCategoriesManager();
        }
        ensureTopAlignment();
    }
    window.switchTab = switchTab;

    // ==========================================
    // GESTURI SWIPE: NAVIGARE TAB-URI & REVENIRE LA PAGINA ANTERIOARA / PANOU / IEȘIRE
    // ==========================================
    const TABS_ORDER = ['tab-overview', 'tab-transactions', 'tab-stats'];

    function navigateBack() {
        // 1. Daca exista un modal deschis, il inchidem si revenim
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            closeModal(activeModal.id);
            return;
        }

        // 2. Daca suntem pe oricare alta pagina decat Panou, sarim direct la ecranul Panou
        const currentActiveTab = document.querySelector('.tab-content.active');
        const activeTabId = currentActiveTab ? currentActiveTab.id : 'tab-overview';

        if (activeTabId !== 'tab-overview') {
            switchTab('tab-overview');
            return;
        }

        // 3. Daca suntem deja pe ecranul Panou, iesim direct din aplicatie
        if (window.AndroidBridge && typeof window.AndroidBridge.exitApp === 'function') {
            window.AndroidBridge.exitApp();
        } else {
            try {
                window.close();
            } catch (e) {}
        }
    }

    // Suport si pentru butonul fizic / gestul nativ Android Back
    window.handleAppBackGesture = function() {
        navigateBack();
        return true;
    };

    function initSwipeNavigation() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchCurrentX = 0;
        let touchCurrentY = 0;
        let touchStartTime = 0;
        let isTracking = false;
        let startTarget = null;

        function isInteractiveInput(target) {
            if (!target) return false;
            const tag = target.tagName ? target.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                return true;
            }
            if (target.closest && target.closest('input, textarea, select')) {
                return true;
            }
            return false;
        }

        document.addEventListener('touchstart', (e) => {
            if (!e.touches || e.touches.length !== 1) {
                isTracking = false;
                return;
            }
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            touchCurrentX = t.clientX;
            touchCurrentY = t.clientY;
            touchStartTime = Date.now();
            startTarget = e.target;
            isTracking = true;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isTracking || !e.touches || e.touches.length !== 1) return;
            const t = e.touches[0];
            touchCurrentX = t.clientX;
            touchCurrentY = t.clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!isTracking) return;
            isTracking = false;

            if (e.changedTouches && e.changedTouches.length > 0) {
                touchCurrentX = e.changedTouches[0].clientX;
                touchCurrentY = e.changedTouches[0].clientY;
            }

            const deltaX = touchCurrentX - touchStartX;
            const deltaY = touchCurrentY - touchStartY;
            const deltaTime = Date.now() - touchStartTime;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            // Daca utilizatorul a atins un input / selector de formular, nu facem swipe
            if (startTarget && isInteractiveInput(startTarget)) {
                return;
            }

            // Prag swipe orizontal clar: minim 35px, orizontal dominant fata de vertical, timp sub 800ms
            if (absX < 35 || absX < absY * 1.15 || deltaTime > 800) {
                return;
            }

            const winWidth = window.innerWidth || document.documentElement.clientWidth || 360;
            const isEdgeSwipe = touchStartX <= 42 || touchStartX >= (winWidth - 42);

            // A. GEST LA MARGINEA ECRANULUI (Edge Swipe -> Inapoi la pagina anterioara / Panou / Iesire)
            if (isEdgeSwipe) {
                navigateBack();
                return;
            }

            // B. GEST PE ECRAN (Screen Swipe -> Trecere intre cele 4 pagini)
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) {
                if (deltaX > 35) {
                    closeModal(activeModal.id);
                }
                return;
            }

            const currentActiveTab = document.querySelector('.tab-content.active');
            const activeTabId = currentActiveTab ? currentActiveTab.id : 'tab-overview';
            const currentIndex = TABS_ORDER.indexOf(activeTabId);
            if (currentIndex === -1) return;

            if (deltaX < -35) {
                // Swipe Stanga -> Pagina urmatoare (Panou -> Tranzactii -> Statistici -> Categorii)
                if (currentIndex < TABS_ORDER.length - 1) {
                    switchTab(TABS_ORDER[currentIndex + 1]);
                }
            } else if (deltaX > 35) {
                // Swipe Dreapta -> Pagina anterioara (Categorii -> Statistici -> Tranzactii -> Panou)
                if (currentIndex > 0) {
                    switchTab(TABS_ORDER[currentIndex - 1]);
                }
            }
        }, { passive: true });

        document.addEventListener('touchcancel', () => {
            isTracking = false;
        }, { passive: true });
    }

    initSwipeNavigation();

    // Ascultatori pentru butoanele normale de tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Ascultatori pentru optiunile din meniul dropdown landscape
    document.querySelectorAll('.landscape-menu-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    // Ascultatori pentru optiunile din meniul activat la apasarea pe M
    document.querySelectorAll('.logo-menu-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });

    const btnNavToggle = document.getElementById('btnLandscapeNavToggle');
    const landscapeNavMenu = document.getElementById('landscapeNavMenu');
    if (btnNavToggle && landscapeNavMenu) {
        btnNavToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            landscapeNavMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#landscapeNavDropdown')) {
                landscapeNavMenu.classList.remove('show');
            }
        });
    }

    // Deschidere selector valutar la apasarea pe logo-ul M
    const btnLogoMenu = document.getElementById('btnLogoMenu');
    if (btnLogoMenu) {
        btnLogoMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            renderCurrencyPickerModal();
            openModal('modalCurrencyPicker');
        });
    }

    // Apasare pe scutul de Autonomie din antet -> Deschidere tab Statistici
    const headerRunwayWidget = document.getElementById('headerRunwayWidget');
    if (headerRunwayWidget) {
        headerRunwayWidget.addEventListener('click', () => {
            switchTab('tab-stats');
        });
    }

    // Period Select in Overview (Styled Modal Filter)
    initOverviewPeriodFilter();

    // Buton Categorii (deasupra graficului Donut - navigare la Tab Categorii)
    const btnNavCat = document.getElementById('btnNavToCategories');
    if (btnNavCat) {
        btnNavCat.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            switchTab('tab-categories');
        });
    }

    // Buton Înapoi din Tab Categorii
    const btnBackCat = document.getElementById('btnBackFromCategories');
    if (btnBackCat) {
        btnBackCat.addEventListener('click', (e) => {
            e.preventDefault();
            navigateBack();
        });
    }

    // Buton Export toate Categoriile (butonul cu format ca cel din Fond Disponibil, așezat la mijloc)
    const btnExportAll = document.getElementById('btnExportAllCategories');
    if (btnExportAll) {
        btnExportAll.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openExportAllCategoriesModal();
        });
    }

    // Buton Export Categorie Individuală (în modalul de detalii categorie)
    const btnExportCat = document.getElementById('btnExportCategoryDetail');
    if (btnExportCat) {
        btnExportCat.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openExportSingleCategoryModal(currentDetailCategoryId);
        });
    }

    // Cele 4 acțiuni din Modalul de Export
    const btnExpCopy = document.getElementById('btnExportActionCopy');
    if (btnExpCopy) btnExpCopy.addEventListener('click', copyExportText);

    const btnExpWa = document.getElementById('btnExportActionWhatsApp');
    if (btnExpWa) btnExpWa.addEventListener('click', shareExportWhatsApp);

    const btnExpPrint = document.getElementById('btnExportActionPrint');
    if (btnExpPrint) btnExpPrint.addEventListener('click', printExportDocument);

    const btnExpDownload = document.getElementById('btnExportActionDownload');
    if (btnExpDownload) btnExpDownload.addEventListener('click', downloadExportFile);

    // Theme Toggle
    document.getElementById('btnThemeToggle').addEventListener('click', () => {
        const newTheme = appData.settings.theme === 'dark' ? 'light' : 'dark';
        appData.settings.theme = newTheme;
        saveData();
        applyTheme(newTheme);
        renderOverviewChartAndList();
        if (document.getElementById('tab-stats').style.display !== 'none') {
            renderStatsTab();
        }
    });

    // Backup & Restore
    const btnBackup = document.getElementById('btnBackup');
    if (btnBackup) {
        btnBackup.addEventListener('click', () => {
            openModal('modalBackupBox');
        });
    }

    // Cod QR & Partajare / Instalare APK
    function openQrShareModal() {
        const url = (window.location && window.location.href && window.location.href.startsWith('http') && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
            ? window.location.href.split('#')[0].split('?')[0]
            : 'https://valydd.github.io/MoneyApp/';

        const urlDisplay = document.getElementById('qrShareUrlDisplay');
        if (urlDisplay) urlDisplay.textContent = url;

        const container = document.getElementById('qrShareCodeContainer');
        if (container) {
            container.innerHTML = '';
            if (typeof QRCode !== 'undefined') {
                new QRCode(container, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } else {
                container.innerHTML = `<img src="qrcode.png" alt="Cod QR" style="width:200px;height:200px;display:block;border-radius:8px;">`;
            }
        }
        openModal('modalQrShare');
    }

    const btnQrModal = document.getElementById('btnQrModal');
    if (btnQrModal) {
        btnQrModal.addEventListener('click', openQrShareModal);
    }

    const btnCopyShareUrl = document.getElementById('btnCopyShareUrl');
    if (btnCopyShareUrl) {
        btnCopyShareUrl.addEventListener('click', () => {
            const urlDisplay = document.getElementById('qrShareUrlDisplay');
            const text = urlDisplay ? urlDisplay.textContent.trim() : window.location.href;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    showToast(t('link_copied', currentLang) || 'Link copiat în clipboard!');
                }).catch(() => {
                    showToast(text);
                });
            } else {
                showToast(text);
            }
        });
    }

    // Convertor & Setări Valutare
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            const amtInput = document.getElementById('converterAmountInput');
            if (amtInput && (!amtInput.value || parseFloat(amtInput.value) <= 0)) {
                amtInput.value = '100';
            }
            const eurInput = document.getElementById('settingEurRate');
            if (eurInput) eurInput.value = appData.settings.eurRate || 4.98;
            renderCurrencyConverter();
            openModal('modalSettings');
        });
    }

    const convAmtInput = document.getElementById('converterAmountInput');
    if (convAmtInput) {
        convAmtInput.addEventListener('input', renderCurrencyConverter);
        convAmtInput.addEventListener('keyup', renderCurrencyConverter);
        convAmtInput.addEventListener('change', renderCurrencyConverter);
    }

    // Butoane presetare sumă în convertor
    document.querySelectorAll('.conv-chip[data-amount]').forEach(chip => {
        chip.addEventListener('click', () => {
            if (convAmtInput) {
                convAmtInput.value = chip.dataset.amount;
                renderCurrencyConverter();
            }
        });
    });

    const btnConvUseBalance = document.getElementById('btnConvUseBalance');
    if (btnConvUseBalance) {
        btnConvUseBalance.addEventListener('click', () => {
            let totalIncomeRon = 0;
            let totalExpenseRon = 0;
            appData.transactions.forEach(t => {
                if (isTxSuspended(t)) return;
                const a = parseFloat(t.amountInRon) || parseFloat(t.amount) || 0;
                if (t.type === 'income') totalIncomeRon += a;
                else if (t.type === 'expense') totalExpenseRon += a;
            });
            const balRon = totalIncomeRon - totalExpenseRon;
            const balActive = Math.max(0, convertFromRon(balRon, getActiveCurrency()));
            if (convAmtInput) {
                convAmtInput.value = balActive.toFixed(2);
                renderCurrencyConverter();
            }
        });
    }

    const formSettings = document.getElementById('formSettings');
    if (formSettings) {
        formSettings.addEventListener('submit', (e) => {
            e.preventDefault();
            const rate = parseFloat(document.getElementById('settingEurRate').value);
            if (rate > 0) {
                appData.settings.eurRate = rate;
                saveData();
                renderCurrencyConverter();
                updateBalanceCards();
                renderOverviewChartAndList();
                renderTransactionsHistory();
                renderStatsTab();
                showToast(`Cursul euro a fost actualizat: 1 EUR = ${rate.toFixed(2)} lei!`, 'success');
            }
        });
    }

    const btnRefreshRates = document.getElementById('btnRefreshRates');
    if (btnRefreshRates) {
        btnRefreshRates.addEventListener('click', (e) => {
            e.preventDefault();
            fetchLiveExchangeRates(true);
        });
    }

    // Modal Close Buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.getAttribute('data-close'));
        });
    });

    // Close modal on background click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    // Functii pentru Modificare Cheltuiala / Venit
    window.openEditExpenseModal = function(tx) {
        populateCurrencySelectors();
        const mainCurr = getActiveCurrency();
        const txCurr = tx.originalCurrency || mainCurr;
        const expSelect = document.getElementById('expenseCurrencySelect');
        if (expSelect) expSelect.value = txCurr;

        document.getElementById('editExpenseId').value = tx.id;
        document.getElementById('modalExpenseTitle').innerHTML = `<span style="color:var(--accent)">✏️</span> ${t('modal_edit_expense')}`;
        document.getElementById('btnSubmitExpense').textContent = t('btn_save');
        const displayAmt = tx.amount ? parseFloat(tx.amount).toFixed(2) : convertFromRon(tx.amountInRon, txCurr).toFixed(2);
        document.getElementById('expenseAmount').value = displayAmt;
        renderExpenseCategoryPicker();
        document.getElementById('selectedExpenseCategoryId').value = tx.categoryId;
        document.querySelectorAll('#expenseCategoryPicker .cat-pick-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.id === tx.categoryId);
        });
        document.getElementById('expenseDate').value = tx.date;
        const expTimeInput = document.getElementById('expenseTime');
        if (expTimeInput) {
            if (tx.time) {
                expTimeInput.value = tx.time;
            } else if (tx.createdAt) {
                const d = new Date(tx.createdAt);
                expTimeInput.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            } else {
                expTimeInput.value = '12:00';
            }
        }
        const mc = getTransactionMerchantAndComment(tx);
        const merchantHidden = document.getElementById('selectedExpenseMerchant');
        if (merchantHidden) merchantHidden.value = mc.merchant || '';
        document.getElementById('expenseDesc').value = mc.comment || '';
        
        const popover = document.getElementById('foodMerchantsFloatingOverlay');
        if (popover) popover.style.display = 'none';
        updateFoodMerchantsQuickPicker(tx.categoryId, false);
        
        const expPayMethod = (tx.paymentMethod === 'cash') ? 'cash' : 'card';
        const expPayInput = document.getElementById('expensePaymentMethod');
        if (expPayInput) expPayInput.value = expPayMethod;
        document.querySelectorAll('#expensePaymentMethodGroup .btn-pay-method').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === expPayMethod);
        });

        const suspInput = document.getElementById('expenseIsSuspended');
        if (suspInput) suspInput.checked = !!tx.isSuspended;

        // Inchidem ferestrele din spate pentru a nu suprapune modalele
        closeModal('modalCategoryDetails');
        closeModal('modalSuspendedTransactions');
        
        openModal('modalExpense');
        updateExpenseLivePreview();
        setTimeout(() => {
            const amt = document.getElementById('expenseAmount');
            if (amt) {
                amt.focus({ preventScroll: true });
            }
        }, 150);
    };

    window.openEditIncomeModal = function(tx) {
        populateCurrencySelectors();
        const mainCurr = getActiveCurrency();
        const txCurr = tx.originalCurrency || mainCurr;
        const incSelect = document.getElementById('incomeCurrencySelect');
        if (incSelect) incSelect.value = txCurr;

        const editIdInput = document.getElementById('editIncomeId');
        if (editIdInput) editIdInput.value = tx.id;
        const titleEl = document.getElementById('modalIncomeTitle');
        if (titleEl) titleEl.innerHTML = `<span style="color:var(--accent)">✏️</span> ${t('modal_edit_income')}`;
        const submitBtn = document.getElementById('btnSubmitIncome');
        if (submitBtn) submitBtn.textContent = t('btn_save');
        const amtInput = document.getElementById('incomeAmount');
        if (amtInput) amtInput.value = tx.amount ? parseFloat(tx.amount) : convertFromRon(tx.amountInRon, txCurr);
        updateIncomeLivePreview();
        const dateInput = document.getElementById('incomeDate');
        if (dateInput) dateInput.value = tx.date;
        const incTimeInput = document.getElementById('incomeTime');
        if (incTimeInput) {
            if (tx.time) {
                incTimeInput.value = tx.time;
            } else if (tx.createdAt) {
                const d = new Date(tx.createdAt);
                incTimeInput.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            } else {
                incTimeInput.value = '12:00';
            }
        }
        const srcInput = document.getElementById('incomeSource');
        if (srcInput) srcInput.value = tx.description || '';
        
        const incPayMethod = (tx.paymentMethod === 'cash') ? 'cash' : 'card';
        const incPayInput = document.getElementById('incomePaymentMethod');
        if (incPayInput) incPayInput.value = incPayMethod;
        document.querySelectorAll('#incomePaymentMethodGroup .btn-pay-method').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === incPayMethod);
        });

        const suspInput = document.getElementById('incomeIsSuspended');
        if (suspInput) suspInput.checked = !!tx.isSuspended;

        closeModal('modalSuspendedTransactions');
        openModal('modalIncome');
        setTimeout(() => {
            const amt = document.getElementById('incomeAmount');
            if (amt) {
                amt.focus({ preventScroll: true });
            }
        }, 150);
    };

    window.openAddTransferModal = function(defaultDir = 'card-to-cash') {
        const form = document.getElementById('formTransfer');
        if (form) form.reset();
        const editIdInput = document.getElementById('editTransferId');
        if (editIdInput) editIdInput.value = '';
        const titleEl = document.getElementById('modalTransferTitleText');
        if (titleEl) titleEl.textContent = 'Transfer Intern (Card ⇄ Cash)';
        const submitBtn = document.getElementById('btnSubmitTransfer');
        if (submitBtn) submitBtn.textContent = 'Salvează Transferul';

        const dirInput = document.getElementById('transferDirection');
        if (dirInput) dirInput.value = defaultDir;
        document.querySelectorAll('#transferDirectionGroup .btn-transfer-dir').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.direction === defaultDir);
        });

        const dateInput = document.getElementById('transferDate');
        if (dateInput) dateInput.value = getTodayString();
        const timeInput = document.getElementById('transferTime');
        if (timeInput) {
            const now = new Date();
            timeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
        const descInput = document.getElementById('transferDescription');
        if (descInput) descInput.value = '';

        openModal('modalTransfer');
        setTimeout(() => {
            const amt = document.getElementById('transferAmount');
            if (amt) amt.focus({ preventScroll: true });
        }, 150);
    };

    window.openEditTransferModal = function(tx) {
        const form = document.getElementById('formTransfer');
        if (form) form.reset();
        const editIdInput = document.getElementById('editTransferId');
        if (editIdInput) editIdInput.value = tx.id;
        const titleEl = document.getElementById('modalTransferTitleText');
        if (titleEl) titleEl.textContent = 'Modifică Transferul';
        const submitBtn = document.getElementById('btnSubmitTransfer');
        if (submitBtn) submitBtn.textContent = t('btn_save');

        const dir = tx.transferDirection || 'card-to-cash';
        const dirInput = document.getElementById('transferDirection');
        if (dirInput) dirInput.value = dir;
        document.querySelectorAll('#transferDirectionGroup .btn-transfer-dir').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.direction === dir);
        });

        const mainCurr = getActiveCurrency();
        const txCurr = tx.originalCurrency || mainCurr;
        const displayAmt = tx.amount ? parseFloat(tx.amount).toFixed(2) : convertFromRon(tx.amountInRon, txCurr).toFixed(2);
        const amtInput = document.getElementById('transferAmount');
        if (amtInput) amtInput.value = displayAmt;

        const dateInput = document.getElementById('transferDate');
        if (dateInput) dateInput.value = tx.date;
        const timeInput = document.getElementById('transferTime');
        if (timeInput) {
            if (tx.time) {
                timeInput.value = tx.time;
            } else if (tx.createdAt) {
                const d = new Date(tx.createdAt);
                timeInput.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            } else {
                timeInput.value = '12:00';
            }
        }
        const descInput = document.getElementById('transferDescription');
        if (descInput) descInput.value = tx.description || '';

        openModal('modalTransfer');
        setTimeout(() => {
            const amt = document.getElementById('transferAmount');
            if (amt) amt.focus({ preventScroll: true });
        }, 150);
    };

    // Live Preview instant pe masura ce utilizatorul tasteaza
    function updateExpenseLivePreview() {
        const amtInput = document.getElementById('expenseAmount');
        const previewBox = document.getElementById('expenseLivePreview');
        const previewVal = document.getElementById('expenseLiveAmount');
        const diffRow = document.getElementById('expenseEditDiffRow');
        const initLabel = document.getElementById('expenseEditInitialLabel');
        const diffLabel = document.getElementById('expenseEditDiffLabel');
        if (!amtInput || !previewBox) return;

        const val = parseFloat(amtInput.value);
        const editId = document.getElementById('editExpenseId') ? document.getElementById('editExpenseId').value : '';
        const expCurr = document.getElementById('expenseCurrencySelect')?.value || getActiveCurrency();
        const mainCurr = getActiveCurrency();

        if (val > 0) {
            previewBox.style.display = 'block';
            previewVal.textContent = formatMoney(val, expCurr);

            if (expCurr !== mainCurr) {
                const inMain = convertFromRon(convertToRon(val, expCurr), mainCurr);
                diffRow.style.display = 'flex';
                initLabel.textContent = `≈ ${formatMoney(inMain, mainCurr)} (${mainCurr})`;
                diffLabel.textContent = '';
            } else if (editId) {
                const existing = appData.transactions.find(t => t.id === editId);
                if (existing) {
                    diffRow.style.display = 'flex';
                    const initMain = convertFromRon(existing.amountInRon || existing.amount, mainCurr);
                    initLabel.textContent = `Inițial: ${formatMoney(initMain, mainCurr)}`;
                    const diff = val - initMain;
                    if (diff > 0) {
                        diffLabel.textContent = `+${formatMoney(diff, mainCurr)} în plus`;
                        diffLabel.style.color = 'var(--danger)';
                    } else if (diff < 0) {
                        diffLabel.textContent = `${formatMoney(diff, mainCurr)} mai puțin`;
                        diffLabel.style.color = 'var(--success)';
                    } else {
                        diffLabel.textContent = `Nicio schimbare`;
                        diffLabel.style.color = 'var(--text-muted)';
                    }
                } else {
                    diffRow.style.display = 'none';
                }
            } else {
                diffRow.style.display = 'none';
            }
        } else {
            previewBox.style.display = 'none';
        }
    }

    function updateIncomeLivePreview() {
        const amtInput = document.getElementById('incomeAmount');
        const previewBox = document.getElementById('incomeLivePreview');
        const previewVal = document.getElementById('incomeLiveAmount');
        const hintEl = document.getElementById('incomeEurConversionHint');
        if (!amtInput || !previewBox) return;

        const val = parseFloat(amtInput.value);
        const incCurr = document.getElementById('incomeCurrencySelect')?.value || getActiveCurrency();
        const mainCurr = getActiveCurrency();

        if (val > 0) {
            previewBox.style.display = 'block';
            previewVal.textContent = formatMoney(val, incCurr);
            if (incCurr !== mainCurr) {
                const inMain = convertFromRon(convertToRon(val, incCurr), mainCurr);
                if (hintEl) {
                    hintEl.style.display = 'block';
                    hintEl.textContent = `≈ ${formatMoney(inMain, mainCurr)} (${mainCurr})`;
                }
            } else {
                if (hintEl) hintEl.style.display = 'none';
            }
        } else {
            previewBox.style.display = 'none';
        }
    }

    const expAmtEl = document.getElementById('expenseAmount');
    if (expAmtEl) {
        expAmtEl.addEventListener('input', updateExpenseLivePreview);
        expAmtEl.addEventListener('keyup', updateExpenseLivePreview);
        expAmtEl.addEventListener('change', updateExpenseLivePreview);
    }
    const expCurEl = document.getElementById('expenseCurrencySelect');
    if (expCurEl) {
        expCurEl.addEventListener('change', updateExpenseLivePreview);
    }

    const incAmtEl = document.getElementById('incomeAmount');
    if (incAmtEl) {
        incAmtEl.addEventListener('input', updateIncomeLivePreview);
        incAmtEl.addEventListener('keyup', updateIncomeLivePreview);
        incAmtEl.addEventListener('change', updateIncomeLivePreview);
    }
    const incCurEl = document.getElementById('incomeCurrencySelect');
    if (incCurEl) {
        incCurEl.addEventListener('change', updateIncomeLivePreview);
    }

    // Selector Metoda de Plata (Card / Cash) - Evenimente Click
    document.querySelectorAll('#expensePaymentMethodGroup .btn-pay-method').forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.dataset.method || 'card';
            const input = document.getElementById('expensePaymentMethod');
            if (input) input.value = method;
            document.querySelectorAll('#expensePaymentMethodGroup .btn-pay-method').forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    document.querySelectorAll('#incomePaymentMethodGroup .btn-pay-method').forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.dataset.method || 'card';
            const input = document.getElementById('incomePaymentMethod');
            if (input) input.value = method;
            document.querySelectorAll('#incomePaymentMethodGroup .btn-pay-method').forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    // Single Button for Total Expense & Total Income in Balance Card
    const btnToggleTotals = document.getElementById('btnToggleTotalsSummary');
    if (btnToggleTotals) {
        btnToggleTotals.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openTotalsSummaryModal();
        });
    }

    // Button for Fund Conversion Currency Picker
    const btnFundCurr = document.getElementById('btnBalanceCurrencyPicker');
    if (btnFundCurr) {
        btnFundCurr.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openFundCurrencyPickerModal();
        });
    }

    // Transfer Modal Direction selector
    document.querySelectorAll('#transferDirectionGroup .btn-transfer-dir').forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.dataset.direction || 'card-to-cash';
            const input = document.getElementById('transferDirection');
            if (input) input.value = dir;
            document.querySelectorAll('#transferDirectionGroup .btn-transfer-dir').forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    // Quick Transfer Button & Card/Cash clickable boxes
    const btnOpenTransfer = document.getElementById('btnOpenTransferModal');
    if (btnOpenTransfer) {
        btnOpenTransfer.addEventListener('click', (e) => {
            e.stopPropagation();
            openAddTransferModal('card-to-cash');
        });
    }

    const boxCard = document.getElementById('boxSourceCard');
    if (boxCard) {
        boxCard.addEventListener('click', () => {
            openAddTransferModal('card-to-cash');
        });
    }

    const boxCash = document.getElementById('boxSourceCash');
    if (boxCash) {
        boxCash.addEventListener('click', () => {
            openAddTransferModal('cash-to-card');
        });
    }

    // Form Transfer Submit
    const formTransfer = document.getElementById('formTransfer');
    if (formTransfer) {
        formTransfer.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('editTransferId').value;
            const dir = document.getElementById('transferDirection').value || 'card-to-cash';
            const amtVal = parseFloat(document.getElementById('transferAmount').value);
            const dateVal = document.getElementById('transferDate').value || getTodayString();
            const timeVal = document.getElementById('transferTime').value || '12:00';
            const descVal = (document.getElementById('transferDescription').value || '').trim();

            if (isNaN(amtVal) || amtVal <= 0) {
                alert('Vă rugăm să introduceți o sumă validă!');
                return;
            }

            const mainCurr = getActiveCurrency();
            const amountInRon = convertToRon(amtVal, mainCurr);
            const defaultDesc = dir === 'card-to-cash' ? 'Transfer Card ➔ Cash (ATM)' : 'Transfer Cash ➔ Card (Depunere)';

            if (editId) {
                const idx = appData.transactions.findIndex(t => t.id === editId);
                if (idx !== -1) {
                    appData.transactions[idx] = {
                        ...appData.transactions[idx],
                        type: 'transfer',
                        transferDirection: dir,
                        amount: amtVal,
                        originalCurrency: mainCurr,
                        amountInRon: amountInRon,
                        description: descVal || defaultDesc,
                        date: dateVal,
                        time: timeVal
                    };
                    showToast('Transfer modificat cu succes!', 'success');
                }
            } else {
                const newTx = {
                    id: 'tx-transfer-' + Date.now(),
                    type: 'transfer',
                    transferDirection: dir,
                    amount: amtVal,
                    originalCurrency: mainCurr,
                    amountInRon: amountInRon,
                    description: descVal || defaultDesc,
                    date: dateVal,
                    time: timeVal,
                    createdAt: Date.now(),
                    isSuspended: false
                };
                appData.transactions.push(newTx);
                showToast(`🔄 Transfer înregistrat: ${formatMoney(amtVal, mainCurr)} (${dir === 'card-to-cash' ? 'Card ➔ Cash' : 'Cash ➔ Card'})`, 'success');
            }

            saveData();
            updateBalanceCards();
            renderTransactionsHistory();
            renderOverviewChartAndList();
            closeModal('modalTransfer');
        });
    }

    // Quick Add Expense Button
    const btnOpenExpense = document.getElementById('btnOpenAddExpense');
    if (btnOpenExpense) {
        btnOpenExpense.addEventListener('click', () => {
            const form = document.getElementById('formExpense');
            if (form) form.reset();
            const editId = document.getElementById('editExpenseId');
            if (editId) editId.value = '';
            const selectedHidden = document.getElementById('selectedExpenseCategoryId');
            if (selectedHidden) selectedHidden.value = '';
            const selectedMerchantHidden = document.getElementById('selectedExpenseMerchant');
            if (selectedMerchantHidden) selectedMerchantHidden.value = '';
            const descInput = document.getElementById('expenseDesc');
            if (descInput) descInput.value = '';
            const popover = document.getElementById('foodMerchantsFloatingOverlay');
            if (popover) popover.style.display = 'none';

            const expPayInput = document.getElementById('expensePaymentMethod');
            if (expPayInput) expPayInput.value = 'card';
            document.querySelectorAll('#expensePaymentMethodGroup .btn-pay-method').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.method === 'card');
            });

            populateCurrencySelectors();
            const expSelect = document.getElementById('expenseCurrencySelect');
            if (expSelect) expSelect.value = getActiveCurrency();
            const titleEl = document.getElementById('modalExpenseTitle');
            if (titleEl) titleEl.innerHTML = `<span style="color:var(--danger)">▼</span> ${t('modal_add_expense')}`;
            const submitBtn = document.getElementById('btnSubmitExpense');
            if (submitBtn) submitBtn.textContent = t('btn_save');
            const dateInput = document.getElementById('expenseDate');
            if (dateInput) dateInput.value = getTodayString();
            const expTimeInput = document.getElementById('expenseTime');
            if (expTimeInput) {
                const now = new Date();
                expTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            }
            const suspInput = document.getElementById('expenseIsSuspended');
            if (suspInput) suspInput.checked = false;

            const previewBox = document.getElementById('expenseLivePreview');
            if (previewBox) previewBox.style.display = 'none';
            renderExpenseCategoryPicker();
            openModal('modalExpense');
            setTimeout(() => {
                const amt = document.getElementById('expenseAmount');
                if (amt) amt.focus({ preventScroll: true });
            }, 150);
        });
    }

    // Buton Configurare Categorii Magazine (deschide fereastra cu bife)
    const btnConfigCats = document.getElementById('btnConfigMerchantCats');
    if (btnConfigCats) {
        btnConfigCats.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            renderMerchantCatConfigModal();
            openModal('modalMerchantCatConfig');
        });
    }

    // Buton Închidere Meniu Plutitor Magazine
    const btnCloseMerchantPop = document.getElementById('btnCloseMerchantPopover');
    if (btnCloseMerchantPop) {
        btnCloseMerchantPop.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const popover = document.getElementById('foodMerchantsFloatingOverlay');
            if (popover) popover.style.display = 'none';
        });
    }

    // Quick Add Income Button
    const btnOpenIncome = document.getElementById('btnOpenAddIncome');
    if (btnOpenIncome) {
        btnOpenIncome.addEventListener('click', () => {
            const form = document.getElementById('formIncome');
            if (form) form.reset();
            const editId = document.getElementById('editIncomeId');
            if (editId) editId.value = '';

            const incPayInput = document.getElementById('incomePaymentMethod');
            if (incPayInput) incPayInput.value = 'card';
            document.querySelectorAll('#incomePaymentMethodGroup .btn-pay-method').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.method === 'card');
            });

            populateCurrencySelectors();
            const incSelect = document.getElementById('incomeCurrencySelect');
            if (incSelect) incSelect.value = getActiveCurrency();
            const titleEl = document.getElementById('modalIncomeTitle');
            if (titleEl) titleEl.innerHTML = `<span style="color:var(--success)">▲</span> ${t('modal_add_income')}`;
            const submitBtn = document.getElementById('btnSubmitIncome');
            if (submitBtn) submitBtn.textContent = t('btn_save');
            const dateInput = document.getElementById('incomeDate');
            if (dateInput) dateInput.value = getTodayString();
            const incTimeInput = document.getElementById('incomeTime');
            if (incTimeInput) {
                const now = new Date();
                incTimeInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            }
            const suspInput = document.getElementById('incomeIsSuspended');
            if (suspInput) suspInput.checked = false;

            const previewBox = document.getElementById('incomeLivePreview');
            if (previewBox) previewBox.style.display = 'none';
            openModal('modalIncome');
            setTimeout(() => {
                const amt = document.getElementById('incomeAmount');
                if (amt) amt.focus({ preventScroll: true });
            }, 150);
        });
    }

    // Handle Form Expense Submit (Adaugare sau Modificare)
    document.getElementById('formExpense').addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editExpenseId').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const categoryId = document.getElementById('selectedExpenseCategoryId').value;
        const merchant = (document.getElementById('selectedExpenseMerchant')?.value || '').trim();
        const date = document.getElementById('expenseDate').value || getTodayString();
        const now = new Date();
        const fallbackTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const time = document.getElementById('expenseTime')?.value || fallbackTime;
        const description = (document.getElementById('expenseDesc').value || '').trim();
        const paymentMethod = document.getElementById('expensePaymentMethod')?.value || 'card';

        if (!amount || amount <= 0) {
            showToast('Introduceți o sumă validă!', 'error');
            return;
        }

        if (!categoryId) {
            showToast('Alegeți o categorie!', 'error');
            return;
        }

        const currToUse = document.getElementById('expenseCurrencySelect')?.value || getActiveCurrency();
        const amountInRon = convertToRon(amount, currToUse);

        const isSuspended = document.getElementById('expenseIsSuspended')?.checked || false;

        if (editId) {
            // Modificare cheltuiala existenta
            const existing = appData.transactions.find(t => t.id === editId);
            if (existing) {
                existing.amount = amount;
                existing.originalCurrency = currToUse;
                existing.amountInRon = amountInRon;
                existing.categoryId = categoryId;
                existing.date = date;
                existing.time = time;
                existing.merchant = merchant;
                existing.description = description;
                existing.isSuspended = isSuspended;
                existing.paymentMethod = paymentMethod;
            }
            saveData();
            updateBalanceCards();
            renderOverviewChartAndList();
            renderTransactionsHistory();
            renderStatsTab();
            closeModal('modalExpense');
            if (document.getElementById('modalCategoryDetails').classList.contains('active')) {
                openCategoryDetailModal(categoryId);
            }
            if (document.getElementById('modalBillsAnalytics') && document.getElementById('modalBillsAnalytics').classList.contains('active')) {
                renderBillsAnalytics();
            }
            showToast(t('btn_save'), 'success');
            return;
        }

        // Adaugare cheltuiala noua
        const newTx = {
            id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type: 'expense',
            amount: amount,
            originalCurrency: currToUse,
            amountInRon: amountInRon,
            categoryId: categoryId,
            merchant: merchant,
            description: description,
            date: date,
            time: time,
            isSuspended: isSuspended,
            paymentMethod: paymentMethod,
            createdAt: Date.now()
        };

        appData.transactions.push(newTx);
        saveData();
        updateBalanceCards();
        renderOverviewChartAndList();
        renderTransactionsHistory();
        renderStatsTab();
        closeModal('modalExpense');
        if (document.getElementById('modalBillsAnalytics') && document.getElementById('modalBillsAnalytics').classList.contains('active')) {
            renderBillsAnalytics();
        }
        showToast(`- ${formatMoney(amount, currToUse)}`, 'success');
    });

    // Handle Form Income Submit (Adaugare sau Modificare)
    document.getElementById('formIncome').addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('editIncomeId').value;
        const amount = parseFloat(document.getElementById('incomeAmount').value);
        const date = document.getElementById('incomeDate').value || getTodayString();
        const now = new Date();
        const fallbackTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const time = document.getElementById('incomeTime')?.value || fallbackTime;
        const source = (document.getElementById('incomeSource').value || '').trim();
        const isSuspended = document.getElementById('incomeIsSuspended')?.checked || false;
        const paymentMethod = document.getElementById('incomePaymentMethod')?.value || 'card';

        if (!amount || amount <= 0) {
            showToast('Introduceți o sumă validă!', 'error');
            return;
        }

        const currToUse = document.getElementById('incomeCurrencySelect')?.value || getActiveCurrency();
        const amountInRon = convertToRon(amount, currToUse);

        if (editId) {
            // Modificare venit existent
            const existing = appData.transactions.find(t => t.id === editId);
            if (existing) {
                existing.amount = amount;
                existing.originalCurrency = currToUse;
                existing.amountInRon = amountInRon;
                existing.description = source || `Venit (${currToUse})`;
                existing.date = date;
                existing.time = time;
                existing.isSuspended = isSuspended;
                existing.paymentMethod = paymentMethod;
            }
            saveData();
            updateBalanceCards();
            renderOverviewChartAndList();
            renderTransactionsHistory();
            renderStatsTab();
            closeModal('modalIncome');
            showToast(t('btn_save'), 'success');
            return;
        }

        // Adaugare venit nou
        const newTx = {
            id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type: 'income',
            amount: amount,
            originalCurrency: currToUse,
            amountInRon: amountInRon,
            description: source || `Venit (${currToUse})`,
            date: date,
            time: time,
            isSuspended: isSuspended,
            paymentMethod: paymentMethod,
            createdAt: Date.now()
        };

        appData.transactions.push(newTx);
        saveData();
        updateBalanceCards();
        renderOverviewChartAndList();
        renderTransactionsHistory();
        renderStatsTab();
        closeModal('modalIncome');
        showToast(`+ ${formatMoney(amount, currToUse)}`, 'success');
    });

    // Asigurare vizibilitate campuri la deschiderea tastaturii pe mobil
    document.addEventListener('focusin', (e) => {
        if (e.target && e.target.matches && e.target.matches('.modal-box input, .modal-box select, .modal-box textarea')) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 250);
        }
    });

    // Open Add Category Button in Categories Tab
    document.getElementById('btnOpenAddCategory').addEventListener('click', () => {
        openCategoryEditModal(null);
    });

    // Color picker change event
    document.getElementById('categoryColorPicker').addEventListener('input', (e) => {
        document.getElementById('categoryColorCode').textContent = e.target.value;
    });

    // Save Category Form
    document.getElementById('formCategory').addEventListener('submit', (e) => {
        e.preventDefault();
        const catId = document.getElementById('editCategoryId').value;
        const name = (document.getElementById('categoryNameInput').value || '').trim();
        const icon = (document.getElementById('categoryIconInput').value || '').trim() || '🏷️';
        const color = document.getElementById('categoryColorPicker').value;

        if (!name) {
            showToast('Introduceți numele categoriei!', 'error');
            return;
        }

        if (catId) {
            // Edit existing
            const target = appData.categories.find(c => c.id === catId);
            if (target) {
                target.name = name;
                target.icon = icon;
                target.color = color;
            }
            showToast('Categoria a fost actualizată!', 'success');
        } else {
            // Add new
            const newCat = {
                id: 'cat-' + Date.now(),
                name: name,
                icon: icon,
                color: color
            };
            appData.categories.push(newCat);
            showToast('Categorie nouă adăugată!', 'success');
        }

        saveData();
        renderCategoriesManager();
        renderExpenseCategoryPicker();
        renderOverviewChartAndList();
        closeModal('modalCategoryForm');
    });

    // Filter and Search in Transactions Tab
    const btnOpenTxFilter = document.getElementById('btnOpenTxFilter');
    if (btnOpenTxFilter) {
        btnOpenTxFilter.addEventListener('click', () => {
            const curVal = document.getElementById('filterTxType')?.value || 'all';
            document.querySelectorAll('#modalTxTypeFilter .btn-tx-filter-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.type === curVal);
            });
            openModal('modalTxTypeFilter');
        });
    }

    document.querySelectorAll('#modalTxTypeFilter .btn-tx-filter-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type || 'all';
            const hiddenInput = document.getElementById('filterTxType');
            if (hiddenInput) hiddenInput.value = type;

            document.querySelectorAll('#modalTxTypeFilter .btn-tx-filter-option').forEach(b => {
                b.classList.toggle('active', b === btn);
            });

            // Update trigger button icon & label
            const iconEl = document.getElementById('txFilterCurrentIcon');
            const labelEl = document.getElementById('txFilterCurrentLabel');
            const activeLang = getLanguageForCurrency();

            const labelsMap = {
                all: { icon: '⚡', ro: 'Toate', en: 'All', de: 'Alle', tr: 'Tümü', ja: 'すべて', zh: '全部' },
                expense: { icon: '📉', ro: 'Cheltuieli', en: 'Expenses', de: 'Ausgaben', tr: 'Giderler', ja: '支出', zh: '支出' },
                income: { icon: '📈', ro: 'Venituri', en: 'Income', de: 'Einnahmen', tr: 'Gelirler', ja: '収入', zh: '收入' },
                transfer: { icon: '🔄', ro: 'Transferuri', en: 'Transfers', de: 'Transfers', tr: 'Transferler', ja: '振替', zh: '转账' }
            };

            const item = labelsMap[type] || labelsMap.all;
            if (iconEl) iconEl.textContent = item.icon;
            if (labelEl) labelEl.textContent = item[activeLang] || item.ro;

            closeModal('modalTxTypeFilter');
            renderTransactionsHistory();
        });
    });

    // Filtru Perioadă Grafic Donut (Modal Stilizat)
    function updateOverviewPeriodFilterUI(period) {
        const hiddenInput = document.getElementById('overviewPeriod');
        if (hiddenInput) hiddenInput.value = period;

        document.querySelectorAll('#modalOverviewPeriodFilter .btn-tx-filter-option').forEach(b => {
            b.classList.toggle('active', b.dataset.period === period);
        });

        const labelEl = document.getElementById('overviewPeriodCurrentLabel');
        const activeLang = (typeof getLanguageForCurrency === 'function') ? getLanguageForCurrency() : 'ro';
        const periodLabelsMap = {
            'current-month': { ro: 'Luna Aceasta', en: 'This Month', de: 'Dieser Monat', tr: 'Bu Ay', ja: '今月', zh: '本月' },
            'last-month': { ro: 'Luna Trecută', en: 'Last Month', de: 'Letzter Monat', tr: 'Geçen Ay', ja: '先月', zh: '上月' },
            'current-year': { ro: 'Anul Acesta', en: 'This Year', de: 'Dieses Jahr', tr: 'Bu Yıl', ja: '今年', zh: '今年' },
            'all': { ro: 'Toată Perioada', en: 'All Time', de: 'Gesamter Zeitraum', tr: 'Tüm Zamanlar', ja: '全期間', zh: '全部时间' }
        };
        const item = periodLabelsMap[period] || periodLabelsMap['current-month'];
        if (labelEl) labelEl.textContent = item[activeLang] || item.ro;
    }

    function initOverviewPeriodFilter() {
        const btnOpen = document.getElementById('btnOpenOverviewPeriod');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                const curVal = document.getElementById('overviewPeriod')?.value || 'current-month';
                document.querySelectorAll('#modalOverviewPeriodFilter .btn-tx-filter-option').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.period === curVal);
                });
                openModal('modalOverviewPeriodFilter');
            });
        }

        document.querySelectorAll('#modalOverviewPeriodFilter .btn-tx-filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const period = btn.dataset.period || 'current-month';
                updateOverviewPeriodFilterUI(period);
                if (!appData.settings) appData.settings = {};
                appData.settings.overviewPeriod = period;
                saveData();
                closeModal('modalOverviewPeriodFilter');
                renderOverviewChartAndList();
            });
        });

        const savedPeriod = (appData.settings && appData.settings.overviewPeriod) || 'current-month';
        updateOverviewPeriodFilterUI(savedPeriod);
    }

    const filterTxInput = document.getElementById('filterTxType');
    if (filterTxInput && filterTxInput.tagName === 'SELECT') {
        filterTxInput.addEventListener('change', renderTransactionsHistory);
    }
    document.getElementById('searchTxInput').addEventListener('input', renderTransactionsHistory);

    const selectSec = document.getElementById('selectSecondaryCurrency');
    if (selectSec) {
        selectSec.addEventListener('change', (e) => {
            const newCurr = e.target.value;
            if (!appData.settings) appData.settings = {};
            appData.settings.secondaryCurrency = newCurr;
            saveData();
            updateSecondaryCurrencyDisplay();
            renderTransactionsHistory();
            const label = newCurr === 'none' ? 'Fără paranteză' : (newCurr === 'auto' ? 'Auto' : newCurr);
            showToast(`Monedă paranteză: ${label}`, 'info');
        });
    }

    const btnOpenSuspended = document.getElementById('btnOpenSuspendedTx');
    if (btnOpenSuspended) {
        btnOpenSuspended.addEventListener('click', () => {
            openSuspendedTransactionsModal();
        });
    }

    // Stats Tab: Period Pills & Year Select & CSV Export
    const statsYearSelectEl = document.getElementById('statsYearSelect');
    if (statsYearSelectEl) {
        statsYearSelectEl.addEventListener('change', renderStatsTab);
    }

    document.querySelectorAll('#statsPeriodPills .stats-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#statsPeriodPills .stats-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatsPeriod = btn.dataset.period || 'month';
            renderStatsTab();
        });
    });

    const btnExportStatsCsv = document.getElementById('btnExportStatsCsv');
    if (btnExportStatsCsv) {
        btnExportStatsCsv.addEventListener('click', () => {
            exportStatsTableCsv();
        });
    }

    // Backup: Export JSON complet (Tranzactii, Categorii, Setari, Interfata/Tema)
    document.getElementById('btnExportData').addEventListener('click', () => {
        // Asiguram ca setarile curente sunt la zi in appData inainte de export
        appData.settings = {
            ...appData.settings,
            theme: document.body.classList.contains('light-theme') ? 'light' : 'dark',
            eurRate: parseFloat(document.getElementById('settingEurRate')?.value) || appData.settings.eurRate || 4.98,
            overviewPeriod: document.getElementById('overviewPeriod')?.value || 'current-month'
        };

        const exportPayload = {
            appName: 'MoneyApp',
            version: APP_VERSION,
            exportDate: new Date().toISOString(),
            settings: appData.settings,
            categories: appData.categories,
            transactions: appData.transactions
        };

        const jsonStr = JSON.stringify(exportPayload, null, 2);
        const fileName = `moneyapp-backup-${getTodayString()}.json`;

        // Daca rulam in aplicatia nativa APK Android
        if (window.AndroidBridge && typeof window.AndroidBridge.exportBackup === 'function') {
            window.AndroidBridge.exportBackup(jsonStr, fileName);
            showToast('Backup salvat în Descărcări și gata de partajare!', 'success');
            return;
        }

        // Rulare standard in browser
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Fișierul complet (tranzacții, categorii, setări și temă) a fost descărcat!', 'success');
    });

    // Backup: Import JSON (Restaureaza date, categorii, setari si interfata instant)
    document.getElementById('importFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed.categories && (parsed.transactions || parsed.settings)) {
                    // Actualizare categorii
                    if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
                        appData.categories = parsed.categories;
                    }
                    
                    // Actualizare tranzactii
                    if (Array.isArray(parsed.transactions)) {
                        appData.transactions = parsed.transactions;
                    }
                    
                    // Actualizare setari
                    if (parsed.settings) {
                        appData.settings = { ...appData.settings, ...parsed.settings };
                    }

                    // 1. Aplicare imediata a interfetei / temei (Dark / Light)
                    if (appData.settings.theme) {
                        applyTheme(appData.settings.theme);
                    }

                    // 2. Aplicare curs valutar in input si memorie
                    const rateInput = document.getElementById('settingEurRate');
                    if (rateInput && appData.settings.eurRate) {
                        rateInput.value = appData.settings.eurRate;
                    }

                    // 3. Aplicare filtru perioada activa daca exista
                    const periodSelect = document.getElementById('overviewPeriod');
                    if (periodSelect && appData.settings.overviewPeriod) {
                        periodSelect.value = appData.settings.overviewPeriod;
                    }

                    // 4. Salvare permanenta in localStorage
                    saveData();

                    // 5. Re-randare completa a tuturor ecranelor
                    updateBalanceCards();
                    renderExpenseCategoryPicker();
                    renderOverviewChartAndList();
                    renderTransactionsHistory();
                    renderCategoriesManager();
                    renderStatsTab();

                    closeModal('modalBackupBox');
                    showToast('Datele, categoriile, setările și interfața au fost restaurate cu succes!', 'success');
                } else {
                    showToast('Fișierul JSON nu are formatul MoneyApp corect!', 'error');
                }
            } catch (err) {
                showToast('Eroare la citirea fișierului de backup!', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    // Click pe Widgetul de Autonomie Financiara din Antet
    const headerRunwayEl = document.getElementById('headerRunwayWidget');
    if (headerRunwayEl) {
        headerRunwayEl.addEventListener('click', () => {
            const days = calculateGlobalRunwayDays();
            const activeLang = getLanguageForCurrency();
            const unit = activeLang === 'ro' ? 'zile' : (activeLang === 'de' ? 'Tage' : (activeLang === 'tr' ? 'gün' : 'days'));
            showToast(`🛡️ Autonomie: mai ai rezervă pentru ~${days} ${unit} la ritmul actual de cheltuieli!`, 'info');
            const statsTabBtn = document.querySelector('.tab-btn[data-tab="tab-stats"]');
            if (statsTabBtn) statsTabBtn.click();
        });
    }

    // Interactivitate Carduri KPI Statistici (Deschidere Modale cu Detalii Complete)
    const kpiCardsConfig = [
        { id: 'cardStatIncome', action: () => openKpiDetailModal('income') },
        { id: 'cardStatExpense', action: () => openKpiDetailModal('expense') },
        { id: 'cardStatSavings', action: () => openKpiDetailModal('savings') },
        { id: 'cardStatRate', action: () => openKpiDetailModal('rate') },
        { id: 'cardStatDailyAvg', action: () => openKpiDetailModal('daily_avg') },
        { id: 'cardStatPeakExp', action: () => openKpiDetailModal('peak_exp') },
        { id: 'cardStatDailyIncome', action: () => openKpiDetailModal('daily_income') },
        { id: 'cardStatPeakInc', action: () => openKpiDetailModal('peak_inc') },
        { id: 'cardStatAvgTicket', action: () => openMerchantAnalyticsModal(currentStatsPeriod) },
        { id: 'cardStatRunway', action: () => openKpiDetailModal('runway') },
        { id: 'cardStatTotalTxCountCard', action: () => openKpiDetailModal('activity') },
        { id: 'cardStatBillsAnalytics', action: () => openBillsAnalyticsModal(currentStatsPeriod) }
    ];

    kpiCardsConfig.forEach(({ id, action }) => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', action);
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    action();
                }
            });
        }
    });

    // Ascultatori pentru tab-urile de perioada din modalul de Analiza Magazine
    document.querySelectorAll('.merchant-period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.merchant-period-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--text-muted)';
                b.style.fontWeight = '600';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--accent)';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '700';
            currentMerchantPeriod = btn.dataset.period;
            renderMerchantAnalytics();
        });
    });

    // Ascultatori pentru tab-urile de perioada din modalul de Analiza Facturi
    document.querySelectorAll('.bills-period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bills-period-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--text-muted)';
                b.style.fontWeight = '600';
            });
            btn.classList.add('active');
            btn.style.background = 'var(--accent)';
            btn.style.color = '#ffffff';
            btn.style.fontWeight = '700';
            currentBillsPeriod = btn.dataset.period;
            renderBillsAnalytics();
        });
    });

    // Ascultator pentru deschiderea paginii fullscreen cu toate bonurile de mancare
    const btnOpenFoodBasketReceipts = document.getElementById('btnOpenFoodBasketReceipts');
    if (btnOpenFoodBasketReceipts) {
        btnOpenFoodBasketReceipts.addEventListener('click', () => {
            openFoodBasketReceiptsModal();
        });
    }

    // Ascultator cautare in timp real in bonurile de mancare
    const inputSearchFoodReceipts = document.getElementById('inputSearchFoodReceipts');
    if (inputSearchFoodReceipts) {
        inputSearchFoodReceipts.addEventListener('input', () => {
            renderFoodBasketReceiptsModal();
        });
    }

    // =========================================================================
    // SCANER INTELIGENT BONURI ȘI FACTURI (MODAL 15)
    // =========================================================================
    let receiptMediaStream = null;
    let receiptScannerInterval = null;
    let currentScannerFacingMode = 'environment';
    let isScannerTorchOn = false;
    let scannedReceiptResultData = null;
    let barcodeDetectorInstance = null;

    if ('BarcodeDetector' in window) {
        try {
            barcodeDetectorInstance = new BarcodeDetector({
                formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix', 'itf', 'pdf417']
            });
        } catch (e) {
            console.log('BarcodeDetector fallback:', e);
        }
    }

    const btnOpenReceiptScanner = document.getElementById('btnOpenReceiptScanner');
    const btnCloseReceiptScanner = document.getElementById('btnCloseReceiptScanner');
    const btnTriggerFileScan = document.getElementById('btnTriggerFileScan');
    const btnRestartLiveCam = document.getElementById('btnRestartLiveCam');
    const btnToggleTorch = document.getElementById('btnToggleTorch');
    const btnSwitchCamera = document.getElementById('btnSwitchCamera');
    const receiptScannerFileInput = document.getElementById('receiptScannerFileInput');
    const btnCaptureLiveReceipt = document.getElementById('btnCaptureLiveReceipt');
    const btnRescanReceipt = document.getElementById('btnRescanReceipt');
    const btnApplyScannedReceipt = document.getElementById('btnApplyScannedReceipt');
    const scannerViewportContainer = document.getElementById('scannerViewportContainer');

    if (btnOpenReceiptScanner) {
        btnOpenReceiptScanner.addEventListener('click', () => {
            openReceiptScannerModal();
        });
    }

    if (btnCloseReceiptScanner) {
        btnCloseReceiptScanner.addEventListener('click', () => {
            closeReceiptScannerModal();
        });
    }

    if (btnTriggerFileScan && receiptScannerFileInput) {
        btnTriggerFileScan.addEventListener('click', () => {
            receiptScannerFileInput.click();
        });

        receiptScannerFileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                processReceiptFile(file);
            }
            receiptScannerFileInput.value = '';
        });
    }

    if (btnCaptureLiveReceipt) {
        btnCaptureLiveReceipt.addEventListener('click', () => {
            captureLiveSnapshotAndAnalyze();
        });
    }

    if (scannerViewportContainer) {
        scannerViewportContainer.addEventListener('click', (e) => {
            if (e.target.closest('.scanner-cam-controls')) return;
            captureLiveSnapshotAndAnalyze();
        });
    }

    if (btnRestartLiveCam) {
        btnRestartLiveCam.addEventListener('click', () => {
            resetScannerResult();
            startLiveReceiptScanner();
        });
    }

    if (btnToggleTorch) {
        btnToggleTorch.addEventListener('click', () => {
            toggleScannerTorch();
        });
    }

    if (btnSwitchCamera) {
        btnSwitchCamera.addEventListener('click', () => {
            currentScannerFacingMode = currentScannerFacingMode === 'environment' ? 'user' : 'environment';
            startLiveReceiptScanner();
        });
    }

    if (btnRescanReceipt) {
        btnRescanReceipt.addEventListener('click', () => {
            resetScannerResult();
            startLiveReceiptScanner();
        });
    }

    if (btnApplyScannedReceipt) {
        btnApplyScannedReceipt.addEventListener('click', () => {
            applyScannedReceiptDataToExpenseForm();
        });
    }

    // Bridge callbacks pentru recunoaștere nativă OCR (ML Kit)
    window.onNativeReceiptOcrResult = function(recognizedText) {
        console.log('Rezultat OCR Nativ primit:', recognizedText);
        const parsed = parseScannedBarcodeOrText(recognizedText, 'ocr');
        if (parsed) {
            onReceiptDataDetected(parsed);
        } else {
            const lang = getLanguageForCurrency();
            const statusText = document.getElementById('scannerStatusText');
            if (statusText) statusText.textContent = t('scanner_err_no_data', lang);
            showToast(t('scanner_err_no_data', lang), 'error');
        }
    };

    window.onNativeReceiptOcrError = function(err) {
        console.log('Eroare OCR Nativ:', err);
        const lang = getLanguageForCurrency();
        const statusText = document.getElementById('scannerStatusText');
        if (statusText) statusText.textContent = t('scanner_err_no_data', lang);
    };

    function openReceiptScannerModal() {
        resetScannerResult();
        openModal('modalReceiptScanner');
        startLiveReceiptScanner();
    }

    function closeReceiptScannerModal() {
        stopLiveReceiptScanner();
        closeModal('modalReceiptScanner');
    }

    function resetScannerResult() {
        scannedReceiptResultData = null;
        const resultCard = document.getElementById('scannerResultCard');
        const statusText = document.getElementById('scannerStatusText');
        const lang = getLanguageForCurrency();
        if (resultCard) resultCard.style.display = 'none';
        if (statusText) statusText.textContent = t('scanner_status_ready', lang);
    }

    async function startLiveReceiptScanner() {
        stopLiveReceiptScanner();
        const video = document.getElementById('receiptScannerVideo');
        const statusText = document.getElementById('scannerStatusText');
        const btnTorch = document.getElementById('btnToggleTorch');
        const lang = getLanguageForCurrency();

        if (video) {
            video.muted = true;
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (statusText) statusText.textContent = t('scanner_err_camera', lang);
            return;
        }

        try {
            if (statusText) statusText.textContent = t('scanner_status_scanning', lang);
            const constraints = {
                audio: false,
                video: {
                    facingMode: { ideal: currentScannerFacingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            receiptMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (video) {
                video.srcObject = receiptMediaStream;
                try {
                    await video.play();
                } catch (playErr) {
                    console.log('Video play error (retry):', playErr);
                    setTimeout(() => { try { video.play(); } catch(e){} }, 150);
                }
            }

            // Verificare suport lanterna
            if (btnTorch && receiptMediaStream) {
                const track = receiptMediaStream.getVideoTracks()[0];
                const capabilities = track ? track.getCapabilities?.() : null;
                if (capabilities && 'torch' in capabilities) {
                    btnTorch.style.display = 'flex';
                } else {
                    btnTorch.style.display = 'none';
                }
            }

            // Pornire interval de scanare coduri de bare / QR (la fiecare 400ms)
            receiptScannerInterval = setInterval(() => {
                scanLiveVideoBarcodeFrame();
            }, 400);

        } catch (err) {
            console.log('Eroare pornire camera scaner:', err);
            if (statusText) statusText.textContent = t('scanner_err_camera', lang);
        }
    }

    function stopLiveReceiptScanner() {
        if (receiptScannerInterval) {
            clearInterval(receiptScannerInterval);
            receiptScannerInterval = null;
        }
        if (receiptMediaStream) {
            try {
                receiptMediaStream.getTracks().forEach(track => track.stop());
            } catch (e) {}
            receiptMediaStream = null;
        }
        const video = document.getElementById('receiptScannerVideo');
        if (video) video.srcObject = null;
    }

    async function toggleScannerTorch() {
        if (!receiptMediaStream) return;
        const track = receiptMediaStream.getVideoTracks()[0];
        if (!track) return;
        try {
            isScannerTorchOn = !isScannerTorchOn;
            await track.applyConstraints({
                advanced: [{ torch: isScannerTorchOn }]
            });
            const btnTorch = document.getElementById('btnToggleTorch');
            if (btnTorch) btnTorch.style.background = isScannerTorchOn ? 'rgba(234, 179, 8, 0.85)' : 'rgba(15, 23, 42, 0.75)';
        } catch (e) {
            console.log('Torch error:', e);
        }
    }

    async function scanLiveVideoBarcodeFrame() {
        const video = document.getElementById('receiptScannerVideo');
        const canvas = document.getElementById('receiptScannerCanvas');
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Verificare cod de bare prin BarcodeDetector
        if (barcodeDetectorInstance) {
            try {
                const barcodes = await barcodeDetectorInstance.detect(canvas);
                if (barcodes && barcodes.length > 0) {
                    const rawVal = barcodes[0].rawValue || '';
                    if (rawVal) {
                        const parsed = parseScannedBarcodeOrText(rawVal, 'barcode');
                        if (parsed) {
                            onReceiptDataDetected(parsed);
                        }
                    }
                }
            } catch (e) {}
        }
    }

    function captureLiveSnapshotAndAnalyze() {
        const video = document.getElementById('receiptScannerVideo');
        const canvas = document.getElementById('receiptScannerCanvas');
        const statusText = document.getElementById('scannerStatusText');
        const lang = getLanguageForCurrency();

        if (!video || !canvas || video.readyState < 2) {
            showToast('Camera nu este încă gata. Încercați din nou.', 'error');
            return;
        }

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (statusText) statusText.textContent = t('scanner_status_scanning', lang);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        triggerImageAnalysis(dataUrl, canvas);
    }

    function processReceiptFile(file) {
        const reader = new FileReader();
        const statusText = document.getElementById('scannerStatusText');
        const lang = getLanguageForCurrency();
        if (statusText) statusText.textContent = t('scanner_status_scanning', lang);

        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            const img = new Image();
            img.onload = async () => {
                const canvas = document.getElementById('receiptScannerCanvas') || document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                triggerImageAnalysis(dataUrl, canvas);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    function triggerImageAnalysis(dataUrl, canvas) {
        const statusText = document.getElementById('scannerStatusText');
        const lang = getLanguageForCurrency();

        // 1. Dacă suntem în aplicația Android cu suport ML Kit Nativ
        if (window.AndroidBridge && typeof window.AndroidBridge.scanReceiptBase64 === 'function') {
            try {
                window.AndroidBridge.scanReceiptBase64(dataUrl);
                return;
            } catch (e) {
                console.log('AndroidBridge OCR error:', e);
            }
        }

        // 2. Verificare cod de bare pe canvas
        if (barcodeDetectorInstance && canvas) {
            barcodeDetectorInstance.detect(canvas).then(barcodes => {
                if (barcodes && barcodes.length > 0) {
                    const raw = barcodes[0].rawValue || '';
                    const parsed = parseScannedBarcodeOrText(raw, 'barcode');
                    if (parsed) {
                        onReceiptDataDetected(parsed);
                        return;
                    }
                }
                fallbackWebAnalysis(canvas);
            }).catch(() => {
                fallbackWebAnalysis(canvas);
            });
            return;
        }

        fallbackWebAnalysis(canvas);
    }

    function fallbackWebAnalysis(canvas) {
        const lang = getLanguageForCurrency();
        const statusText = document.getElementById('scannerStatusText');
        if (statusText) statusText.textContent = t('scanner_err_no_data', lang);
        showToast(t('scanner_err_no_data', lang), 'error');
    }

    // Catalog extins de furnizori și potriviri inteligente
    const KNOWN_MERCHANT_MAP = [
        // Supermarketuri & Mâncare
        { keys: ['kaufland', 'kauf'], name: 'Kaufland', domain: 'supermarket', catGuess: 'Mâncare', color: '#e11d48', logo: 'K' },
        { keys: ['lidl'], name: 'Lidl', domain: 'supermarket', catGuess: 'Mâncare', color: '#0284c7', logo: 'L' },
        { keys: ['mega image', 'mega', 'megaimage', 'shop&go', 'shop & go'], name: 'Mega Image', domain: 'supermarket', catGuess: 'Mâncare', color: '#dc2626', logo: 'M' },
        { keys: ['carrefour', 'carref'], name: 'Carrefour', domain: 'supermarket', catGuess: 'Mâncare', color: '#2563eb', logo: 'C' },
        { keys: ['auchan'], name: 'Auchan', domain: 'supermarket', catGuess: 'Mâncare', color: '#ef4444', logo: 'A' },
        { keys: ['penny'], name: 'Penny', domain: 'supermarket', catGuess: 'Mâncare', color: '#f59e0b', logo: 'P' },
        { keys: ['profi'], name: 'Profi', domain: 'supermarket', catGuess: 'Mâncare', color: '#10b981', logo: 'P' },
        { keys: ['metro'], name: 'Metro', domain: 'supermarket', catGuess: 'Mâncare', color: '#0284c7', logo: 'M' },
        { keys: ['selgros'], name: 'Selgros', domain: 'supermarket', catGuess: 'Mâncare', color: '#dc2626', logo: 'S' },

        // Benzinării & Transport
        { keys: ['rompetrol'], name: 'Rompetrol', domain: 'fuel', catGuess: 'Transport', color: '#d97706', logo: '⛽' },
        { keys: ['omv'], name: 'OMV', domain: 'fuel', catGuess: 'Transport', color: '#2563eb', logo: '⛽' },
        { keys: ['petrom'], name: 'Petrom', domain: 'fuel', catGuess: 'Transport', color: '#1d4ed8', logo: '⛽' },
        { keys: ['mol', 'mol romania'], name: 'MOL', domain: 'fuel', catGuess: 'Transport', color: '#16a34a', logo: '⛽' },
        { keys: ['lukoil'], name: 'Lukoil', domain: 'fuel', catGuess: 'Transport', color: '#dc2626', logo: '⛽' },
        { keys: ['socar'], name: 'Socar', domain: 'fuel', catGuess: 'Transport', color: '#059669', logo: '⛽' },
        { keys: ['uber', 'bolt'], name: 'Bolt / Uber', domain: 'transport', catGuess: 'Transport', color: '#10b981', logo: '🚗' },

        // Utilități & Energie & Facturi
        { keys: ['hidroelectrica', 'hidro'], name: 'Hidroelectrica', domain: 'utilities', catGuess: 'Facturi', color: '#0284c7', logo: '⚡' },
        { keys: ['electrica', 'electrica furnizare'], name: 'Electrica Furnizare', domain: 'utilities', catGuess: 'Facturi', color: '#2563eb', logo: '⚡' },
        { keys: ['ppc', 'enel', 'enel energie'], name: 'PPC / Enel', domain: 'utilities', catGuess: 'Facturi', color: '#7c3aed', logo: '⚡' },
        { keys: ['e.on', 'eon'], name: 'E.ON Energie', domain: 'utilities', catGuess: 'Facturi', color: '#dc2626', logo: '⚡' },
        { keys: ['engie', 'gdf suez'], name: 'Engie Romania', domain: 'utilities', catGuess: 'Facturi', color: '#0284c7', logo: '🔥' },
        { keys: ['digi', 'rcs&rds', 'rcs-rds', 'rcs rds'], name: 'Digi', domain: 'utilities', catGuess: 'Facturi', color: '#2563eb', logo: '📶' },
        { keys: ['orange'], name: 'Orange', domain: 'utilities', catGuess: 'Facturi', color: '#ea580c', logo: '📱' },
        { keys: ['vodafone'], name: 'Vodafone', domain: 'utilities', catGuess: 'Facturi', color: '#dc2626', logo: '📱' },
        { keys: ['telekom'], name: 'Telekom', domain: 'utilities', catGuess: 'Facturi', color: '#ec4899', logo: '📱' },
        { keys: ['apa nova', 'apanova', 'compania de apa'], name: 'Apa Nova', domain: 'utilities', catGuess: 'Facturi', color: '#0284c7', logo: '💧' },
        { keys: ['ghiseul', 'ghiseul.ro', 'impozit', 'taxe locale'], name: 'Ghișeul.ro / Taxe', domain: 'utilities', catGuess: 'Facturi', color: '#0f766e', logo: '🏛️' },

        // Farmacii & Sănătate
        { keys: ['catena'], name: 'Catena', domain: 'health', catGuess: 'Sănătate', color: '#16a34a', logo: '💊' },
        { keys: ['dr. max', 'drmax', 'dr max'], name: 'Dr. Max', domain: 'health', catGuess: 'Sănătate', color: '#15803d', logo: '💊' },
        { keys: ['farmacia tei', 'tei'], name: 'Farmacia Tei', domain: 'health', catGuess: 'Sănătate', color: '#2563eb', logo: '💊' },
        { keys: ['help net', 'helpnet'], name: 'Help Net', domain: 'health', catGuess: 'Sănătate', color: '#ea580c', logo: '💊' },
        { keys: ['sensiblu'], name: 'Sensiblu', domain: 'health', catGuess: 'Sănătate', color: '#0284c7', logo: '💊' },
        { keys: ['medlife', 'regina maria', 'sanador'], name: 'Clinică Medicală', domain: 'health', catGuess: 'Sănătate', color: '#059669', logo: '🏥' },

        // Bricolaj & Casă & Haine
        { keys: ['dedeman'], name: 'Dedeman', domain: 'home', catGuess: 'Casă', color: '#ea580c', logo: '🔨' },
        { keys: ['leroy merlin', 'leroy'], name: 'Leroy Merlin', domain: 'home', catGuess: 'Casă', color: '#16a34a', logo: '🌿' },
        { keys: ['hornbach'], name: 'Hornbach', domain: 'home', catGuess: 'Casă', color: '#d97706', logo: '🪚' },
        { keys: ['brico depot', 'brico'], name: 'Brico Depot', domain: 'home', catGuess: 'Casă', color: '#dc2626', logo: '🛠️' },
        { keys: ['ikea'], name: 'IKEA', domain: 'home', catGuess: 'Casă', color: '#2563eb', logo: '🛋️' },
        { keys: ['jysk'], name: 'JYSK', domain: 'home', catGuess: 'Casă', color: '#1d4ed8', logo: '🛏️' },
        { keys: ['altex'], name: 'Altex', domain: 'tech', catGuess: 'Electronice', color: '#d97706', logo: '💻' },
        { keys: ['emag'], name: 'eMAG', domain: 'shopping', catGuess: 'Cumpărături', color: '#2563eb', logo: '📦' },
        { keys: ['decathlon'], name: 'Decathlon', domain: 'sport', catGuess: 'Sport', color: '#0284c7', logo: '⚽' },
        { keys: ['zara', 'h&m', 'bershka', 'pull&bear'], name: 'Haine / Modă', domain: 'fashion', catGuess: 'Îmbrăcăminte', color: '#1e293b', logo: '👗' },

        // Restaurante & Fast Food
        { keys: ['mcdonald', 'mcdonalds', 'mc'], name: "McDonald's", domain: 'restaurant', catGuess: 'Restaurant', color: '#dc2626', logo: '🍔' },
        { keys: ['kfc'], name: 'KFC', domain: 'restaurant', catGuess: 'Restaurant', color: '#b91c1c', logo: '🍗' },
        { keys: ['burger king'], name: 'Burger King', domain: 'restaurant', catGuess: 'Restaurant', color: '#c2410c', logo: '👑' },
        { keys: ['glovo', 'tazz', 'bolt food', 'wolt'], name: 'Comandă Mâncare', domain: 'delivery', catGuess: 'Restaurant', color: '#f59e0b', logo: '🛵' },
        { keys: ['starbucks', '5togo', '5 to go'], name: 'Cafenea', domain: 'cafe', catGuess: 'Mâncare', color: '#15803d', logo: '☕' }
    ];

    function parseScannedBarcodeOrText(rawString, source = 'text') {
        if (!rawString || typeof rawString !== 'string') return null;
        const text = rawString.trim();
        if (text.length < 3) return null;

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const low = text.toLowerCase();
        let matchedMerchant = null;
        let amount = null;
        let account = 'card';
        let date = new Date().toISOString().split('T')[0];
        let note = '';

        // 1. Identificare Magazin / Furnizor
        for (const m of KNOWN_MERCHANT_MAP) {
            for (const k of m.keys) {
                if (low.includes(k)) {
                    matchedMerchant = m;
                    break;
                }
            }
            if (matchedMerchant) break;
        }

        // 2. Extragere Sumă inteligentă (din linii specifice sau întreg textul)
        // Căutare linii cu TOTAL, LEI, DE PLATA
        for (const line of lines) {
            const lineMatch = line.match(/(?:TOTAL|TOTAL\s*LEI|TOTAL\s*GENERAL|REST\s*DE\s*PLAT[AĂ]|DE\s*PLAT[AĂ]|SUM[AĂ]|VALOARE|LEI|RON)\s*[:=]?\s*([0-9]{1,6}[.,][0-9]{2})/i);
            if (lineMatch && lineMatch[1]) {
                const parsedNum = parseFloat(lineMatch[1].replace(',', '.'));
                if (!isNaN(parsedNum) && parsedNum > 0) {
                    amount = parsedNum;
                    break;
                }
            }
        }

        // Căutare generală dacă nu s-a găsit pe linie dedicată
        if (!amount) {
            const totalMatches = text.match(/(?:TOTAL|TOTAL\s*LEI|REST\s*DE\s*PLAT[AĂ]|DE\s*PLAT[AĂ]|SUM[AĂ]|VALOARE|LEI|RON)\s*[:=]?\s*([0-9]{1,6}[.,][0-9]{2})/i);
            if (totalMatches && totalMatches[1]) {
                amount = parseFloat(totalMatches[1].replace(',', '.'));
            }
        }

        // Tipar factură utilități (barcode cu coadă de sumă)
        if (!amount && source === 'barcode' && /^\d{16,40}$/.test(text)) {
            const tail = text.slice(-8);
            const numVal = parseInt(tail, 10);
            if (!isNaN(numVal) && numVal > 100 && numVal < 5000000) {
                amount = parseFloat((numVal / 100).toFixed(2));
            }
        }

        // Căutare numere zecimale pe bon
        if (!amount) {
            const anyNums = text.match(/\b([0-9]{1,5}[.,][0-9]{2})\b/g);
            if (anyNums && anyNums.length > 0) {
                const nums = anyNums.map(n => parseFloat(n.replace(',', '.'))).filter(n => !isNaN(n) && n > 0 && n < 100000);
                if (nums.length > 0) {
                    amount = Math.max(...nums);
                }
            }
        }

        // 3. Extragere Metodă de Plată
        if (/(?:NUMERAR|CASH|REST\s*DAT)/i.test(text)) {
            account = 'cash';
        } else if (/(?:CARD|MASTERCARD|VISA|POS|CONTACTLESS|TRANZACTIE|APROBAT)/i.test(text)) {
            account = 'card';
        }

        // 4. Extragere Dată
        const dateMatch = text.match(/\b(0[1-9]|[12][0-9]|3[01])[.\/-](0[1-9]|1[0-2])[.\/-](20\d\d|\d\d)\b/);
        if (dateMatch) {
            let day = dateMatch[1];
            let month = dateMatch[2];
            let year = dateMatch[3];
            if (year.length === 2) year = '20' + year;
            date = `${year}-${month}-${day}`;
        }

        // Notiță
        if (matchedMerchant) {
            note = `Bon: ${matchedMerchant.name}`;
        } else if (lines.length > 0) {
            note = lines[0].slice(0, 30);
        }

        if (!matchedMerchant && (!amount || amount <= 0)) {
            return null;
        }

        const matchedCategory = findBestMatchingCategory(matchedMerchant);

        return {
            merchant: matchedMerchant || { name: 'Comerciant Bon', logo: '🧾', color: '#2563eb' },
            amount: amount ? amount.toFixed(2) : '0.00',
            account: account,
            date: date,
            category: matchedCategory,
            note: note,
            raw: text
        };
    }

    function findBestMatchingCategory(merchantObj) {
        const database = appData || { categories: DEFAULT_CATEGORIES };
        if (!merchantObj || !database.categories || database.categories.length === 0) {
            return (database && database.categories && database.categories[0]) || DEFAULT_CATEGORIES[0];
        }

        const guess = (merchantObj.catGuess || '').toLowerCase();
        const domain = (merchantObj.domain || '').toLowerCase();
        const name = (merchantObj.name || '').toLowerCase();

        // 1. Potrivire exactă după nume sau indiciu
        let found = database.categories.find(c => {
            const cName = (c.name || '').toLowerCase();
            return cName.includes(guess) || guess.includes(cName) || cName.includes(name);
        });
        if (found) return found;

        // 2. Potrivire după domeniu
        if (domain === 'supermarket' || domain === 'food' || domain === 'restaurant' || domain === 'cafe') {
            found = database.categories.find(c => {
                const cName = (c.name || '').toLowerCase();
                return cName.includes('mâncare') || cName.includes('mancare') || cName.includes('alimente') || cName.includes('supermarket') || cName.includes('food');
            });
            if (found) return found;
        }

        if (domain === 'utilities') {
            found = database.categories.find(c => {
                const cName = (c.name || '').toLowerCase();
                return cName.includes('factur') || cName.includes('utilit') || cName.includes('energie') || cName.includes('curent') || cName.includes('gaz');
            });
            if (found) return found;
        }

        if (domain === 'fuel' || domain === 'transport') {
            found = database.categories.find(c => {
                const cName = (c.name || '').toLowerCase();
                return cName.includes('transport') || cName.includes('combustibil') || cName.includes('benzin') || cName.includes('auto');
            });
            if (found) return found;
        }

        if (domain === 'health') {
            found = database.categories.find(c => {
                const cName = (c.name || '').toLowerCase();
                return cName.includes('sănătate') || cName.includes('sanatate') || cName.includes('farmaci') || cName.includes('medic');
            });
            if (found) return found;
        }

        return database.categories[0];
    }

    function onReceiptDataDetected(data) {
        scannedReceiptResultData = data;
        stopLiveReceiptScanner();

        const statusText = document.getElementById('scannerStatusText');
        const resultCard = document.getElementById('scannerResultCard');
        const merchantNameEl = document.getElementById('scannerResultMerchantName');
        const merchantLogoEl = document.getElementById('scannerResultMerchantLogo');
        const amountInput = document.getElementById('scannerResultAmount');
        const currencyEl = document.getElementById('scannerResultCurrency');
        const catIconEl = document.getElementById('scannerResultCatIcon');
        const catNameEl = document.getElementById('scannerResultCatName');
        const accountEl = document.getElementById('scannerResultAccount');
        const dateEl = document.getElementById('scannerResultDate');
        const noteEl = document.getElementById('scannerResultNote');
        const noteWrap = document.getElementById('scannerResultNoteWrap');
        const lang = getLanguageForCurrency();
        const mainCurr = getActiveCurrency();

        if (statusText) statusText.textContent = t('scanner_status_detected', lang);

        if (merchantNameEl) merchantNameEl.textContent = data.merchant.name || 'Comerciant';
        if (merchantLogoEl) merchantLogoEl.textContent = data.merchant.logo || '🏪';
        if (amountInput) amountInput.value = data.amount || '0.00';
        if (currencyEl) currencyEl.textContent = mainCurr;

        if (catNameEl) catNameEl.textContent = data.category ? data.category.name : 'General';
        if (catIconEl) catIconEl.textContent = data.category ? (data.category.icon || '🛍️') : '🛍️';

        if (accountEl) {
            accountEl.textContent = data.account === 'cash' ? '💵 Cash' : '💳 Card';
        }
        if (dateEl) dateEl.textContent = data.date || 'Azi';

        if (noteEl && data.note) {
            noteEl.textContent = `📝 ${data.note}`;
            if (noteWrap) noteWrap.style.display = 'block';
        } else if (noteWrap) {
            noteWrap.style.display = 'none';
        }

        if (resultCard) {
            resultCard.style.display = 'block';
        }

        // Feedback sonor subtil / vibrație
        if (navigator.vibrate) {
            try { navigator.vibrate(80); } catch (e) {}
        }
    }

    function applyScannedReceiptDataToExpenseForm() {
        if (!scannedReceiptResultData) return;

        const data = scannedReceiptResultData;
        const amountInput = document.getElementById('scannerResultAmount');
        const finalAmount = amountInput ? parseFloat(amountInput.value) : parseFloat(data.amount);

        closeReceiptScannerModal();

        // 1. Setare Sumă
        const expenseAmountInput = document.getElementById('expenseAmount');
        if (expenseAmountInput && !isNaN(finalAmount) && finalAmount > 0) {
            expenseAmountInput.value = finalAmount.toFixed(2);
        }

        // 2. Setare Dată
        const expenseDateInput = document.getElementById('expenseDate');
        if (expenseDateInput && data.date) {
            expenseDateInput.value = data.date;
        }

        // 3. Setare Cont (Card / Cash)
        currentExpenseAccount = data.account || 'card';
        updateExpenseAccountChipsUI();

        // 4. Setare Categorie
        if (data.category && data.category.id) {
            selectedExpenseCategoryId = data.category.id;
            const catHiddenInput = document.getElementById('selectedExpenseCategoryId');
            if (catHiddenInput) catHiddenInput.value = data.category.id;
            renderExpenseCategoryPicker();
        }

        // 5. Setare Notiță
        const expenseNoteInput = document.getElementById('expenseNote');
        if (expenseNoteInput && data.note) {
            expenseNoteInput.value = data.note;
        }

        showToast('Datele din bon au fost aplicate în formular!', 'success');
    }

    // Register Service Worker for PWA cu auto-verificare si actualizare imediata
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.protocol === 'http:')) {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => {
                console.log('MoneyApp Service Worker înregistrat cu succes.');
                // Forțează verificarea versiunii noi la fiecare deschidere
                reg.update();
                reg.onupdatefound = () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.onstatechange = () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showToast('Aplicația a fost actualizată la ultima versiune!', 'success');
                                setTimeout(() => window.location.reload(), 800);
                            }
                        };
                    }
                };
            })
            .catch(err => console.log('Service Worker registration skipped:', err));
    }
});




