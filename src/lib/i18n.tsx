import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'nl' | 'en';

type TranslationKeys =
  | 'brand_name'
  | 'slogan'
  | 'creative_dashboard'
  | 'creative_dashboard_desc'
  | 'my_account'
  | 'sign_out'
  | 'search_placeholder'
  | 'new_map'
  | 'no_maps_found'
  | 'no_maps_desc'
  | 'untitled_mindmap'
  | 'nodes_count'
  | 'create_new_map'
  | 'map_name_label'
  | 'cancel'
  | 'create'
  | 'delete_confirm'
  | 'no_map_selected'
  | 'new_node_btn'
  | 'layout_btn'
  | 'layout_tooltip'
  | 'view_map'
  | 'view_list'
  | 'view_both'
  | 'snap_grid'
  | 'theme_btn'
  | 'theme_menu_title'
  | 'theme_default'
  | 'theme_default_desc'
  | 'theme_retro'
  | 'theme_retro_desc'
  | 'theme_warm'
  | 'theme_warm_desc'
  | 'theme_bubble'
  | 'theme_bubble_desc'
  | 'undo'
  | 'redo'
  | 'export_btn'
  | 'export_svg'
  | 'export_png'
  | 'export_pdf'
  | 'export_markdown'
  | 'export_json'
  | 'share_btn'
  | 'cloud_active'
  | 'node_inspector'
  | 'line_inspector'
  | 'inspector_delete'
  | 'inspector_content'
  | 'inspector_shape'
  | 'inspector_background'
  | 'inspector_border'
  | 'inspector_text'
  | 'inspector_typography'
  | 'inspector_bold'
  | 'inspector_italic'
  | 'inspector_line_style'
  | 'style_solid'
  | 'style_dashed'
  | 'style_dotted'
  | 'inspector_line_color'
  | 'inspector_line_width'
  | 'inspector_line_curve'
  | 'curve_straight'
  | 'curve_curved'
  | 'inspector_arrow_start'
  | 'inspector_arrow_end'
  | 'inspector_line_label'
  | 'inspector_label_placeholder'
  | 'outline_title'
  | 'outline_sub'
  | 'outline_new_topic'
  | 'outline_no_topics'
  | 'outline_add_first'
  | 'outline_central_topic'
  | 'outline_type_here'
  | 'outline_add_child'
  | 'outline_delete'
  | 'login_warning_title'
  | 'login_warning_desc'
  | 'login_warning_btn'
  | 'tab_login'
  | 'tab_register'
  | 'field_email'
  | 'field_password'
  | 'field_password_hint'
  | 'btn_email_login'
  | 'btn_email_register'
  | 'btn_google_login'
  | 'loading'
  | 'or_divider'
  | 'auth_invalid_email'
  | 'auth_user_not_found'
  | 'auth_wrong_password'
  | 'auth_weak_password'
  | 'auth_email_in_use'
  | 'auth_generic_error'
  | 'save_success'
  | 'save_error'
  | 'load_error'
  | 'confirm_delete_map_prompt'
  | 'connecting'
  | 'error_saving'
  | 'error_loading'
  | 'unnamed_node'
  | 'new_parent_node'
  | 'new_child_node'
  | 'new_map_notification'
  | 'theme_default_name'
  | 'theme_retro_name'
  | 'theme_warm_name'
  | 'theme_bubble_name'
  | 'custom_label_prompt'
  | 'import_btn'
  | 'import_success'
  | 'import_invalid_file'
  | 'import_error'
  | 'import_json_btn';

const translations: Record<Language, Record<TranslationKeys, string>> = {
  nl: {
    brand_name: 'MindMapper',
    slogan: 'Ontwerp, structureer en verken uw oneindige ideeën.',
    creative_dashboard: 'Creatief Dashboard',
    creative_dashboard_desc: 'Ontwerp, structureer en verken uw oneindige ideeën met gemak.',
    my_account: 'Mijn Account',
    sign_out: 'Log uit',
    search_placeholder: 'Zoek in je kaarten...',
    new_map: 'Nieuwe Kaart',
    no_maps_found: 'Geen kaarten gevonden',
    no_maps_desc: 'Maak je eerste mindmap om je briljante ideeën te visualiseren.',
    untitled_mindmap: 'Naamloze Mindmap',
    nodes_count: 'knopen',
    create_new_map: 'Nieuwe Kaart Maken',
    map_name_label: 'Naam van de kaart',
    cancel: 'Annuleren',
    create: 'Aanmaken',
    delete_confirm: 'Weet je zeker dat je deze mindmap wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
    no_map_selected: 'Geen kaart geselecteerd',
    new_node_btn: 'Nieuwe Knoop',
    layout_btn: 'Lay-out',
    layout_tooltip: 'Auto-schik de knopen rond het centrum',
    view_map: 'Kaart',
    view_list: 'Lijst',
    view_both: 'Beide',
    snap_grid: 'Snap',
    theme_btn: 'Thema',
    theme_menu_title: 'Kies een weergavethema',
    theme_default: 'Standaard',
    theme_default_name: 'Standaard',
    theme_default_desc: 'Modern en helder met zachte schaduwen',
    theme_retro: 'Retro Terminal',
    theme_retro_name: 'Retro Terminal',
    theme_retro_desc: 'Glow-in-the-dark groene retro stijl',
    theme_warm: 'Elegant Warm',
    theme_warm_name: 'Elegant Warm',
    theme_warm_desc: 'Warme crème tinten voor rustig ontwerpen',
    theme_bubble: 'Playful Bubble',
    theme_bubble_name: 'Playful Bubble',
    theme_bubble_desc: 'Vrolijke pastelkleuren met speelse ronde knoppen',
    undo: 'Ongedaan maken',
    redo: 'Opnieuw',
    export_btn: 'Exporteren',
    export_svg: 'SVG Vector',
    export_png: 'PNG Afbeelding',
    export_pdf: 'PDF Document',
    export_markdown: 'Markdown (Lijst)',
    export_json: 'JSON Backup',
    share_btn: 'Delen',
    cloud_active: 'Cloud Actief',
    node_inspector: 'Knoop Inspecteur',
    line_inspector: 'Lijn Inspecteur',
    inspector_delete: 'Verwijderen',
    inspector_content: 'Inhoud',
    inspector_shape: 'Vorm & Stijl',
    inspector_background: 'Achtergrond',
    inspector_border: 'Rand',
    inspector_text: 'Tekst',
    inspector_typography: 'Typografie',
    inspector_bold: 'VET',
    inspector_italic: 'SCHUIN',
    inspector_line_style: 'Lijnstijl',
    style_solid: 'Doorgetrokken',
    style_dashed: 'Gestreept',
    style_dotted: 'Gestippeld',
    inspector_line_color: 'Lijnkleur',
    inspector_line_width: 'Lijnbreedte',
    inspector_line_curve: 'Lijncurve',
    curve_straight: 'Recht',
    curve_curved: 'Gebogen',
    inspector_arrow_start: 'Pijl aan begin',
    inspector_arrow_end: 'Pijl aan einde',
    inspector_line_label: 'Lijnlabel',
    inspector_label_placeholder: 'Labeltekst...',
    outline_title: 'Overzichtsweergave',
    outline_sub: 'Beheer je mindmap als een gestructureerde lijst',
    outline_new_topic: 'Nieuw Onderwerp',
    outline_no_topics: 'Geen onderwerpen gevonden',
    outline_add_first: 'Voeg je eerste onderwerp toe',
    outline_central_topic: 'Centraal Onderwerp',
    outline_type_here: 'Typ hier...',
    outline_add_child: 'Subknoop toevoegen',
    outline_delete: 'Knoop verwijderen',
    login_warning_title: 'Inlogprobleem op iPad of Safari?',
    login_warning_desc: 'Inloggen via Google of e-mail in een ingebed voorbeeldvenster kan worden geblokkeerd door de privacy-instellingen van uw browser. Open de app rechtstreeks in een nieuw tabblad om direct & probleemloos in te loggen.',
    login_warning_btn: 'Open MindMapper in een nieuw tabblad',
    tab_login: 'Inloggen',
    tab_register: 'Registreren',
    field_email: 'E-mailadres',
    field_password: 'Wachtwoord',
    field_password_hint: 'Wachtwoord (min. 6 tekens)',
    btn_email_login: 'Inloggen met E-mail',
    btn_email_register: 'Registreren & Starten',
    btn_google_login: 'Inloggen met Google',
    loading: 'Laden...',
    or_divider: 'of',
    auth_invalid_email: 'Ongeldig e-mailadres formaat.',
    auth_user_not_found: 'Geen gebruiker gevonden met dit e-mailadres.',
    auth_wrong_password: 'Onjuist wachtwoord.',
    auth_weak_password: 'Wachtwoord is te zwak. Gebruik minimaal 6 tekens.',
    auth_email_in_use: 'Dit e-mailadres is al in gebruik.',
    auth_generic_error: 'Er is een fout opgetreden. Controleer je gegevens.',
    save_success: 'Succesvol opgeslagen in de cloud.',
    save_error: 'Er is een fout opgetreden bij het opslaan.',
    load_error: 'Er is een fout opgetreden bij het laden van je mindmaps.',
    confirm_delete_map_prompt: 'Weet je zeker dat je deze mindmap wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
    connecting: 'Verbinden...',
    error_saving: 'Fout bij opslaan',
    error_loading: 'Fout bij laden',
    unnamed_node: 'Nieuwe knoop',
    new_parent_node: 'Centraal onderwerp',
    new_child_node: 'Subonderwerp',
    new_map_notification: 'Nieuwe mindmap aangemaakt',
    custom_label_prompt: 'Typ een label voor de lijn...',
    import_btn: 'Importeer Backup',
    import_success: 'Backup succesvol geïmporteerd!',
    import_invalid_file: 'Fout: Ongeldig mindmap JSON-bestand.',
    import_error: 'Importeren mislukt. Probeer het opnieuw.',
    import_json_btn: 'JSON Backup Laden'
  },
  en: {
    brand_name: 'MindMapper',
    slogan: 'Design, structure, and explore your infinite ideas.',
    creative_dashboard: 'Creative Dashboard',
    creative_dashboard_desc: 'Design, structure, and explore your infinite ideas with ease.',
    my_account: 'My Account',
    sign_out: 'Log Out',
    search_placeholder: 'Search your maps...',
    new_map: 'New Map',
    no_maps_found: 'No maps found',
    no_maps_desc: 'Create your first mind map to start visualizing your brilliant ideas.',
    untitled_mindmap: 'Untitled Mind Map',
    nodes_count: 'nodes',
    create_new_map: 'Create New Map',
    map_name_label: 'Map Name',
    cancel: 'Cancel',
    create: 'Create',
    delete_confirm: 'Are you sure you want to delete this mind map? This action cannot be undone.',
    no_map_selected: 'No Map Selected',
    new_node_btn: 'New Node',
    layout_btn: 'Layout',
    layout_tooltip: 'Auto-arrange nodes around the center',
    view_map: 'Map',
    view_list: 'List',
    view_both: 'Both',
    snap_grid: 'Snap',
    theme_btn: 'Theme',
    theme_menu_title: 'Choose a visual theme',
    theme_default: 'Default',
    theme_default_name: 'Default',
    theme_default_desc: 'Modern and clean with soft shadows',
    theme_retro: 'Retro Terminal',
    theme_retro_name: 'Retro Terminal',
    theme_retro_desc: 'Glow-in-the-dark green retro style',
    theme_warm: 'Elegant Warm',
    theme_warm_name: 'Elegant Warm',
    theme_warm_desc: 'Warm cream tones for focused design',
    theme_bubble: 'Playful Bubble',
    theme_bubble_name: 'Playful Bubble',
    theme_bubble_desc: 'Cheerful pastel colors with playful round buttons',
    undo: 'Undo',
    redo: 'Redo',
    export_btn: 'Export',
    export_svg: 'SVG Vector',
    export_png: 'PNG Image',
    export_pdf: 'PDF Document',
    export_markdown: 'Markdown (List)',
    export_json: 'JSON Backup',
    share_btn: 'Share',
    cloud_active: 'Cloud Active',
    node_inspector: 'Node Inspector',
    line_inspector: 'Line Inspector',
    inspector_delete: 'Delete',
    inspector_content: 'Content',
    inspector_shape: 'Shape & Style',
    inspector_background: 'Background',
    inspector_border: 'Border',
    inspector_text: 'Text',
    inspector_typography: 'Typography',
    inspector_bold: 'BOLD',
    inspector_italic: 'ITALIC',
    inspector_line_style: 'Line Style',
    style_solid: 'Solid',
    style_dashed: 'Dashed',
    style_dotted: 'Dotted',
    inspector_line_color: 'Line Color',
    inspector_line_width: 'Line Width',
    inspector_line_curve: 'Line Curve',
    curve_straight: 'Straight',
    curve_curved: 'Curved',
    inspector_arrow_start: 'Arrow at Start',
    inspector_arrow_end: 'Arrow at End',
    inspector_line_label: 'Line Label',
    inspector_label_placeholder: 'Label text...',
    outline_title: 'Outline View',
    outline_sub: 'Manage your mindmap as a structured list',
    outline_new_topic: 'New Topic',
    outline_no_topics: 'No topics found',
    outline_add_first: 'Add your first topic',
    outline_central_topic: 'Central Topic',
    outline_type_here: 'Type here...',
    outline_add_child: 'Add Subnode',
    outline_delete: 'Delete node',
    login_warning_title: 'Login issue on iPad or Safari?',
    login_warning_desc: 'Logging in via Google or email inside an embedded preview iframe may be blocked by your browser\'s privacy settings. Open the app directly in a new tab to log in smoothly.',
    login_warning_btn: 'Open MindMapper in a new tab',
    tab_login: 'Log In',
    tab_register: 'Register',
    field_email: 'Email Address',
    field_password: 'Password',
    field_password_hint: 'Password (min. 6 characters)',
    btn_email_login: 'Log In with Email',
    btn_email_register: 'Register & Start',
    btn_google_login: 'Log In with Google',
    loading: 'Loading...',
    or_divider: 'or',
    auth_invalid_email: 'Invalid email address format.',
    auth_user_not_found: 'No user found with this email address.',
    auth_wrong_password: 'Incorrect password.',
    auth_weak_password: 'Password is too weak. Please use at least 6 characters.',
    auth_email_in_use: 'This email address is already in use.',
    auth_generic_error: 'An error occurred. Please check your inputs.',
    save_success: 'Successfully saved to the cloud.',
    save_error: 'An error occurred while saving.',
    load_error: 'An error occurred while loading your mind maps.',
    confirm_delete_map_prompt: 'Are you sure you want to delete this mind map? This action cannot be undone.',
    connecting: 'Connecting...',
    error_saving: 'Error saving',
    error_loading: 'Error loading',
    unnamed_node: 'New node',
    new_parent_node: 'Central topic',
    new_child_node: 'Subtopic',
    new_map_notification: 'New mind map created',
    custom_label_prompt: 'Type a label for the line...',
    import_btn: 'Import Backup',
    import_success: 'Backup imported successfully!',
    import_invalid_file: 'Error: Invalid mindmap JSON file.',
    import_error: 'Import failed. Please try again.',
    import_json_btn: 'Load JSON Backup'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mindmap_language');
    if (saved === 'en' || saved === 'nl') {
      return saved;
    }
    // Fallback to Dutch default as requested or browser language
    try {
      const browserLang = navigator.language.substring(0, 2);
      if (browserLang === 'nl') return 'nl';
    } catch {
      // Empty
    }
    return 'nl';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('mindmap_language', lang);
  };

  const t = (key: TranslationKeys): string => {
    return translations[language][key] || translations['nl'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
