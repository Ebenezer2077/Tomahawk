
export function keyboard() {
    const keys = {};

    // toggle wird bei keydown:active=true oder keyup:active=false aufgerufen
    function toggle(ev, active) {

        // falls Taste mit Callback belegt?
        if (keys[ev.key] !== undefined) {
            const KeyObject = keys[ev.key];
            if (KeyObject.active !== active) {
                KeyObject.active = active;
                KeyObject.callback(active);
            }
        } else {
            console.log(`Unbekannter Key <${ev.key}>`);
        }
    }

    // Listener
    document.addEventListener("keydown", (ev) => toggle(ev, true));
    document.addEventListener("keyup", (ev) => toggle(ev, false));

    function add(key, callback) {
        keys[key] = { active: false, callback };  // KeyObject, oben
    }

    return add;
}

const MOVESCALE = 0.001;

export function mouse(cursor) {

    const mouseButtons = [false, false, false, false];
    function toggle(ev, active) {
        mouseButtons[ev.which] = active;
        // console.log(mouseButtons);
    }

    function onMouseMove(ev) {
        const dx = ev.movementX * MOVESCALE;
        const dy = ev.movementY * MOVESCALE;

        const isRotation = ev.ctrlKey;

        if (!isRotation && mouseButtons[1]) {
            cursor.position.x += dx;
            cursor.position.y -= dy;
        }

        if (!isRotation && mouseButtons[3]) {
            cursor.position.x += dx;
            cursor.position.z += dy;
        }

        if (isRotation && mouseButtons[1]) {
            cursor.rotation.x += dy;
            cursor.rotation.z += dx;
        }
        cursor.updateMatrix();

    }

    // Listener
    document.addEventListener("mousedown", (ev) => toggle(ev, true));
    document.addEventListener("mouseup", (ev) => toggle(ev, false));
    document.addEventListener("mousemove", onMouseMove);

    document.addEventListener('contextmenu', ev => {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    });

}


