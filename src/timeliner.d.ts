export interface LayerProp {
    name: String;
    values: Array;

    _value;
    _color;
}

export class Timeliner {
    constructor(target: Object);
    setTarget(target: Object);
    openLocalSave(): void;
    save(): void;
    load(): void;
    getValues();
    setStatus();
    addLayer(name: String);
    dispose();
}