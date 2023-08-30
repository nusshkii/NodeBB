"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webserver_1 = __importDefault(require("../webserver"));
const plugins_1 = __importDefault(require("../plugins"));
const groups_1 = __importDefault(require("../groups"));
const index_1 = __importDefault(require("./index"));
const promisify_1 = __importDefault(require("../promisify"));
async function renderAdminTemplate() {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const groupsData = await groups_1.default.getNonPrivilegeGroups('groups:createtime', 0, -1);
    groupsData.sort((a, b) => (b.system ? 1 : 0) - (a.system ? 1 : 0));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await webserver_1.default.app.renderAsync('admin/partials/widget-settings', { groups: groupsData });
}
async function getAvailableWidgets() {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [widgets, adminTemplate] = await Promise.all([
        plugins_1.default.hooks.fire('filter:widgets.getWidgets', []),
        renderAdminTemplate(),
    ]);
    const availableWidgets = widgets.map((w) => {
        w.content += adminTemplate;
        return w;
    });
    return availableWidgets;
}
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
            template: '',
        });
    });
    return templates;
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
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const areas = await plugins_1.default.hooks.fire('filter:widgets.getAreas', defaultAreas);
        areas.push({ name: 'Draft Zone', template: 'global', location: 'drafts' });
        const areaData = await Promise.all(
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        areas.map(async (area) => await index_1.default.getArea(area.template, area.location)));
        areas.forEach((area, i) => {
            area.data = areaData[i];
        });
        return areas;
    },
};
(0, promisify_1.default)(admin);
