"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const webserver = __importStar(require("../webserver"));
const plugins = __importStar(require("../plugins"));
const groups = __importStar(require("../groups"));
const index = __importStar(require("./index"));
async function renderAdminTemplate() {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const groupsData = await groups.getNonPrivilegeGroups('groups:createtime', 0, -1);
    groupsData.sort((a, b) => (b.system ? 1 : 0) - (a.system ? 1 : 0));
    // Suppress ESLint warnings about unsafe access
    return await webserver.app.renderAsync('admin/partials/widget-settings', { groups: groupsData });
}
async function getAvailableWidgets() {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [widgets, adminTemplate] = await Promise.all([
        plugins.hooks.fire('filter:widgets.getWidgets', []),
        renderAdminTemplate()
    ]);
    const availableWidgets = widgets.map((w) => {
        w.content += adminTemplate;
        return w;
    });
    return availableWidgets;
}
const admin = {
    get: async function () {
        const [areas, availableWidgets] = await Promise.all([
            admin.getAreas(),
            getAvailableWidgets(),
        ]);
        return {
            templates: buildTemplatesFromAreas(areas),
            areas: areas,
            availableWidgets: availableWidgets,
        };
    },
    getAreas: async function () {
        const defaultAreas = [
            { name: 'Global Sidebar', template: 'global', location: 'sidebar' },
            { name: 'Global Header', template: 'global', location: 'header' },
            { name: 'Global Footer', template: 'global', location: 'footer' },
            { name: 'Group Page (Left)', template: 'groups/details.tpl', location: 'left' },
            { name: 'Group Page (Right)', template: 'groups/details.tpl', location: 'right' },
        ];
        // Suppress ESLint warnings about unsafe access
        const areas = await plugins.hooks.fire('filter:widgets.getAreas', defaultAreas);
        areas.push({ name: 'Draft Zone', template: 'global', location: 'drafts' });
        // Suppress ESLint warnings about unsafe access
        const areaData = await Promise.all(areas.map(async (area) => await index.getArea(area.template, area.location)));
        areas.forEach((area, i) => {
            area.data = areaData[i];
        });
        return areas;
    },
};
function buildTemplatesFromAreas(areas) {
    const templates = [];
    const list = {};
    let index = 0;
    areas.forEach((area) => {
        if (typeof list[area.template] === 'undefined') {
            list[area.template] = index;
            templates.push({
                template: area.template,
                areas: [],
            });
            index += 1;
        }
        templates[list[area.template]].areas.push({
            name: area.name,
            location: area.location,
        });
    });
    return templates;
}
require('../promisify')(admin);
