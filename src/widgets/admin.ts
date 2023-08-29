import * as webserver from '../webserver';
import * as plugins from '../plugins';
import * as groups from '../groups';
import * as index from './index';
import { Widget, Area, GroupData } from './type'; // You need to define the types yourself

const admin: any = {};

admin.get = async function (): Promise<any> {
    const [areas, availableWidgets] = await Promise.all([
        admin.getAreas(),
        getAvailableWidgets(),
    ]);

    return {
        templates: buildTemplatesFromAreas(areas),
        areas: areas,
        availableWidgets: availableWidgets,
    };
};

admin.getAreas = async function (): Promise<Area[]> {
    const defaultAreas: Area[] = [
        { name: 'Global Sidebar', template: 'global', location: 'sidebar' },
        { name: 'Global Header', template: 'global', location: 'header' },
        { name: 'Global Footer', template: 'global', location: 'footer' },

        { name: 'Group Page (Left)', template: 'groups/details.tpl', location: 'left' },
        { name: 'Group Page (Right)', template: 'groups/details.tpl', location: 'right' },
    ];

    const areas: Area[] = await plugins.hooks.fire('filter:widgets.getAreas', defaultAreas);

    areas.push({ name: 'Draft Zone', template: 'global', location: 'drafts' });
    const areaData: any[] = await Promise.all(areas.map(async (area) => await index.getArea(area.template, area.location)));
    areas.forEach((area, i) => {
        area.data = areaData[i];
    });
    return areas;
};

async function getAvailableWidgets(): Promise<Widget[]> {
    const [availableWidgets, adminTemplate] = await Promise.all([
        plugins.hooks.fire('filter:widgets.getWidgets', []),
        renderAdminTemplate(),
    ]);
    availableWidgets.forEach((w) => {
        w.content += adminTemplate;
    });
    return availableWidgets;
}

async function renderAdminTemplate(): Promise<string> {
    const groupsData: GroupData[] = await groups.getNonPrivilegeGroups('groups:createtime', 0, -1);
    groupsData.sort((a, b) => (b.system ? 1 : 0) - (a.system ? 1 : 0));

    return await webserver.app.renderAsync('admin/partials/widget-settings', { groups: groupsData });
}

function buildTemplatesFromAreas(areas: Area[]): any[] {
    const templates: any[] = [];
    const list: { [key: string]: number } = {};
    let index: number = 0;

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
