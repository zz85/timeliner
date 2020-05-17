import { Do } from "./do";

export class DockingWindow {
    allowMove(allow: boolean): void;
    maximize(): void;
    resizes: Do;
}