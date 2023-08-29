// types.ts

export interface Area {
    name: string;
    template: string;
    location: string;
    data?: any; // Define a suitable type for data here
}

export interface Widget {
    content: string;
    // Define other properties as needed
}

export interface GroupData {
    system: boolean; // Add the 'system' property if it's part of your data
    // Define other properties that are part of GroupData
}
