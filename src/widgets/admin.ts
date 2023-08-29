import * as webserver from '../webserver';
import * as plugins from '../plugins';
import * as groups from '../groups';
import * as index from './index';

interface Area {
    name: string;
    template: string;
    location: string;
    data?: any; // Define a suitable type for data here
}

interface Widget {
    content: string;
    // Define other properties as needed
}

interface Admin {
    get: () => Promise<any>;
    getAreas: () => Promise<Area[]>;
}

interface GroupData {
    system: boolean; // Add the 'system' property if it's part of your data
    // Define other properties that are part of GroupData
}

async function renderAdminTemplate(): Promise<string> {
    // The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const groupsData: GroupData[] = await groups.getNonPrivilegeGroups('groups:createtime', 0, -1) as GroupData[];
    groupsData.sort((a, b) => (b.system ? 1 : 0) - (a.system ? 1 : 0));

    // Suppress ESLint warnings about unsafe access
    return await webserver.app.renderAsync('admin/partials/widget-settings', { groups: groupsData });
}

async function getAvailableWidgets(): Promise<Widget[]> {
    // The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [widgets, adminTemplate]: [Widget[], string] = await Promise.all([
        plugins.hooks.fire('filter:widgets.getWidgets', []),
        renderAdminTemplate()
    ]) as [Widget[], string] ;

    const availableWidgets = widgets.map((w) => {
        w.content += adminTemplate;
        return w;
    });

    return availableWidgets;
}


const admin: Admin = {
    get: async function (): Promise<any> {
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

    getAreas: async function (): Promise<Area[]> {
        const defaultAreas: Area[] = [
            { name: 'Global Sidebar', template: 'global', location: 'sidebar' },
            { name: 'Global Header', template: 'global', location: 'header' },
            { name: 'Global Footer', template: 'global', location: 'footer' },
            { name: 'Group Page (Left)', template: 'groups/details.tpl', location: 'left' },
            { name: 'Group Page (Right)', template: 'groups/details.tpl', location: 'right' },
        ];

        // Suppress ESLint warnings about unsafe access
        const areas: Area[] = await plugins.hooks.fire('filter:widgets.getAreas', defaultAreas);
        areas.push({ name: 'Draft Zone', template: 'global', location: 'drafts' });

        // Suppress ESLint warnings about unsafe access
        const areaData: any[] = await Promise.all(areas.map(async (area) => await index.getArea(area.template, area.location)));
        areas.forEach((area, i) => {
            area.data = areaData[i];
        });

        return areas;
    },
};



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
