/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useState, createContext, useMemo, useEffect, useContext, useLayoutEffect, useRef } from "react";
import TopBarProgress from "react-topbar-progress-indicator";
import { appContext } from "../../contexts/AppProvider";
import getSettingsFromCSSVar from "../../util/html-util/GetSettingsFromCSSVar";

// Interface for the topbar-context
export interface TopBarContextType {
    show: Function
    hide: Function
}


export const TopBarContext = createContext<TopBarContextType>({
    show: () => {},
    hide: () => {}
});

let topbarCount = 0;

/**
 * Shows the topbar and after the promise is fulfilled, the topbar disappears
 * @param promise - the promise which is being sent
 * @param topbar - the topbar to display
 * @returns 
 */
export function showTopBar(promise: Promise<any>, topbar: TopBarContextType) {
    topbarCount++;
    topbar.show();
    return promise.catch((err) => console.error(err)).finally(() => {
        topbarCount--;
        if (!topbarCount) {
            topbar.hide()
        }
    });
};

// Shows a topbar at the top of the browser when a promise is being processed.
const TopBar:FC = ({children}) => {
    const context = useContext(appContext);

    const [show, setShow] = useState(false);

    const [initial, setInitial] = useState(true);

    const [designerTopbarChanged, setDesignerTopbarChanged] = useState<boolean>(false);

    const testRef = useRef<boolean>(false);

    useEffect(() => {
        context.designerSubscriptions.subscribeToTopbarColor(() => setDesignerTopbarChanged(prevState => !prevState))

        return () => context.designerSubscriptions.unsubscribeFromTopbarColor();
    }, [context.designerSubscriptions]);

    useLayoutEffect(() => {
        TopBarProgress.config({
            barColors: {0: "#ffffff"},
            barThickness: 0
        });
        showTopBar(new Promise((resolve) => {
            setShow(true);
            resolve({})
        }), {
            show: () => setShow(true),
            hide: () => setShow(false)
        }).then(() => {
            setTimeout(() => {
                console.log('then')
                setShow(false);
                setInitial(false);
            }, 800)
        })
    }, [])

    useEffect(() => {
        if (!initial) {
            const canvases = document.getElementsByTagName("canvas");
        }
        console.log(initial, document.getElementsByTagName("canvas"))
    }, [initial])

    const topbarSettings = useMemo(() => {
        if (!initial) {
            return getSettingsFromCSSVar({
                barColors: {
                    cssVar: '--topbar-colors',
                    transform: 'csv'
                },
                shadowBlur: {
                    cssVar: '--topbar-shadow-blur',
                    transform: 'float'
                },
                barThickness: {
                    cssVar: '--topbar-thickness',
                    transform: 'float'
                },
                shadowColor: '--topbar-shadow-color'
            })
        }
        else {
            return undefined;
        }
    }, [designerTopbarChanged, initial]);

    useEffect(() => {
        if (topbarSettings) {
            TopBarProgress.config({
                barColors: Object.fromEntries((topbarSettings.barColors as string[]).map((v, idx, a) => [idx / (a.length - 1), v])),
                shadowBlur: topbarSettings.shadowBlur,
                barThickness: topbarSettings.barThickness,
                shadowColor: topbarSettings.shadowColor
            });
        }
    }, [topbarSettings, initial, show]);

    useEffect(() => {
        context.server.topbar = {
            show: () => setShow(true),
            hide: () => setShow(false)
        }
        context.server.hideTopbar = () => setShow(false);
    }, [context.server])

    return <TopBarContext.Provider value={{
        show: () => setShow(true),
        hide: () => setShow(false)
    }} >
        {children}
        {show ? <TopBarProgress /> : null }
    </TopBarContext.Provider>
}

export default TopBar;