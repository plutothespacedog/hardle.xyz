import React, {useContext, useState} from 'react'
import {AppContext} from "../App";

function Key({keyVal, bigKey}) {
    const {onSelectLetter, onEnter, onDelete} = useContext(AppContext);
    const [pressed, setPressed] = useState(false);

    const selectLetter = () => {
        if(keyVal === "ENTER"){
            onEnter()
        }
        else if(keyVal === "DELETE"){
            onDelete()
        }
        else {
            onSelectLetter(keyVal)
        }
    };

    // React on touch-down rather than on release, so fast typing on a phone
    // feels instant and never turns into a double-tap zoom.
    const onPointerDown = (e) => {
        e.preventDefault();
        setPressed(true);
        selectLetter();
    };
    const release = () => setPressed(false);

  return (
   <div
        className={pressed ? 'key keyPressed' : 'key'}
        id={bigKey ? "big" : undefined}
        role='button'
        aria-label={keyVal}
        onPointerDown={onPointerDown}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
   >
        {keyVal}
    </div>
  );
}

export default Key
