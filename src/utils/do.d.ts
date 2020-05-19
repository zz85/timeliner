export class Do {
    constructor();

    do(callback: () => any): void;
    undo(callback: () => any): void;
    fire(...args: any[]): void;
}
