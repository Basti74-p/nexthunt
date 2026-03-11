/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Abteilungen from './pages/Abteilungen';
import Aufgaben from './pages/Aufgaben';
import Dashboard from './pages/Dashboard';
import Jagdeinrichtungen from './pages/Jagdeinrichtungen';
import Jagdgaeste from './pages/Jagdgaeste';
import Jagdkalender from './pages/Jagdkalender';
import JagdkalenderMain from './pages/JagdkalenderMain';
import Karte from './pages/Karte';
import Kunden from './pages/Kunden';
import MobileMap from './pages/MobileMap';
import MobileMonitor from './pages/MobileMonitor';
import MobileSightings from './pages/MobileSightings';
import MobileStrecke from './pages/MobileStrecke';
import MobileTasks from './pages/MobileTasks';
import Oeffentlichkeit from './pages/Oeffentlichkeit';
import Personal from './pages/Personal';
import Personen from './pages/Personen';
import Persons from './pages/Persons';
import PlatformAdmin from './pages/PlatformAdmin';
import Revier from './pages/Revier';
import RevierDetail from './pages/RevierDetail';
import Reviere from './pages/Reviere';
import Strecke from './pages/Strecke';
import StreckeAbschussplan from './pages/StreckeAbschussplan';
import StreckeArchiv from './pages/StreckeArchiv';
import StreckeWildkammer from './pages/StreckeWildkammer';
import StreckeWildverkauf from './pages/StreckeWildverkauf';
import SupportTickets from './pages/SupportTickets';
import SystemAdmin from './pages/SystemAdmin';
import SystemAdminSupport from './pages/SystemAdminSupport';
import SystemAdminTenants from './pages/SystemAdminTenants';
import TenantMembers from './pages/TenantMembers';
import TenantSettings from './pages/TenantSettings';
import WildProdukte from './pages/WildProdukte';
import WildRehwild from './pages/WildRehwild';
import WildRotwild from './pages/WildRotwild';
import WildSchwarzwild from './pages/WildSchwarzwild';
import WildWolf from './pages/WildWolf';
import Wildmanagement from './pages/Wildmanagement';
import Wildverkauf from './pages/Wildverkauf';
import JagdDetail from './pages/JagdDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Abteilungen": Abteilungen,
    "Aufgaben": Aufgaben,
    "Dashboard": Dashboard,
    "Jagdeinrichtungen": Jagdeinrichtungen,
    "Jagdgaeste": Jagdgaeste,
    "Jagdkalender": Jagdkalender,
    "JagdkalenderMain": JagdkalenderMain,
    "Karte": Karte,
    "Kunden": Kunden,
    "MobileMap": MobileMap,
    "MobileMonitor": MobileMonitor,
    "MobileSightings": MobileSightings,
    "MobileStrecke": MobileStrecke,
    "MobileTasks": MobileTasks,
    "Oeffentlichkeit": Oeffentlichkeit,
    "Personal": Personal,
    "Personen": Personen,
    "Persons": Persons,
    "PlatformAdmin": PlatformAdmin,
    "Revier": Revier,
    "RevierDetail": RevierDetail,
    "Reviere": Reviere,
    "Strecke": Strecke,
    "StreckeAbschussplan": StreckeAbschussplan,
    "StreckeArchiv": StreckeArchiv,
    "StreckeWildkammer": StreckeWildkammer,
    "StreckeWildverkauf": StreckeWildverkauf,
    "SupportTickets": SupportTickets,
    "SystemAdmin": SystemAdmin,
    "SystemAdminSupport": SystemAdminSupport,
    "SystemAdminTenants": SystemAdminTenants,
    "TenantMembers": TenantMembers,
    "TenantSettings": TenantSettings,
    "WildProdukte": WildProdukte,
    "WildRehwild": WildRehwild,
    "WildRotwild": WildRotwild,
    "WildSchwarzwild": WildSchwarzwild,
    "WildWolf": WildWolf,
    "Wildmanagement": Wildmanagement,
    "Wildverkauf": Wildverkauf,
    "JagdDetail": JagdDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};