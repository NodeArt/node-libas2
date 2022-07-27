export declare class LibObjectID {
    constructor(map: Array<[string, string]>);
    private map;
    byId(id: string): ObjectID;
    byName(name: string): ObjectID;
    has(nameOrId: string): boolean;
    static init(): LibObjectID;
}
export declare const objectIds: LibObjectID;
export declare class ObjectID {
    constructor({ name, id }: {
        name?: string;
        id?: string;
    });
    name: string;
    id: string;
}
