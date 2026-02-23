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
import Dashboard from './pages/Dashboard';
import PlatformAdmin from './pages/PlatformAdmin';
import Reviere from './pages/Reviere';
import TenantMembers from './pages/TenantMembers';
import Persons from './pages/Persons';
import TenantSettings from './pages/TenantSettings';
import RevierDetail from './pages/RevierDetail';
import MobileMap from './pages/MobileMap';
import MobileSightings from './pages/MobileSightings';
import MobileStrecke from './pages/MobileStrecke';
import MobileTasks from './pages/MobileTasks';
import MobileMonitor from './pages/MobileMonitor';
import Jagdeinrichtungen from './pages/Jagdeinrichtungen';
import Abteilungen from './pages/Abteilungen';
import WildRotwild from './pages/WildRotwild';
import WildSchwarzwild from './pages/WildSchwarzwild';
import WildRehwild from './pages/WildRehwild';
import WildWolf from './pages/WildWolf';
import StreckeAbschussplan from './pages/StreckeAbschussplan';
import StreckeWildkammer from './pages/StreckeWildkammer';
import StreckeWildverkauf from './pages/StreckeWildverkauf';
import StreckeArchiv from './pages/StreckeArchiv';
import Jagdkalender from './pages/Jagdkalender';
import Jagdgaeste from './pages/Jagdgaeste';
import Personal from './pages/Personal';
import Aufgaben from './pages/Aufgaben';
import Oeffentlichkeit from './pages/Oeffentlichkeit';
import Revier from './pages/Revier';
import Wildmanagement from './pages/Wildmanagement';
import Strecke from './pages/Strecke';
import JagdkalenderMain from './pages/JagdkalenderMain';
import Personen from './pages/Personen';
import SystemAdmin from './pages/SystemAdmin';
import SystemAdminTenants from './pages/SystemAdminTenants';
import SystemAdminSupport from './pages/SystemAdminSupport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "PlatformAdmin": PlatformAdmin,
    "Reviere": Reviere,
    "TenantMembers": TenantMembers,
    "Persons": Persons,
    "TenantSettings": TenantSettings,
    "RevierDetail": RevierDetail,
    "MobileMap": MobileMap,
    "MobileSightings": MobileSightings,
    "MobileStrecke": MobileStrecke,
    "MobileTasks": MobileTasks,
    "MobileMonitor": MobileMonitor,
    "Jagdeinrichtungen": Jagdeinrichtungen,
    "Abteilungen": Abteilungen,
    "WildRotwild": WildRotwild,
    "WildSchwarzwild": WildSchwarzwild,
    "WildRehwild": WildRehwild,
    "WildWolf": WildWolf,
    "StreckeAbschussplan": StreckeAbschussplan,
    "StreckeWildkammer": StreckeWildkammer,
    "StreckeWildverkauf": StreckeWildverkauf,
    "StreckeArchiv": StreckeArchiv,
    "Jagdkalender": Jagdkalender,
    "Jagdgaeste": Jagdgaeste,
    "Personal": Personal,
    "Aufgaben": Aufgaben,
    "Oeffentlichkeit": Oeffentlichkeit,
    "Revier": Revier,
    "Wildmanagement": Wildmanagement,
    "Strecke": Strecke,
    "JagdkalenderMain": JagdkalenderMain,
    "Personen": Personen,
    "SystemAdmin": SystemAdmin,
    "SystemAdminTenants": SystemAdminTenants,
    "SystemAdminSupport": SystemAdminSupport,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};