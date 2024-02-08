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

import React, { CSSProperties, FC, useCallback, useMemo, useRef, useState } from "react";
import { Tooltip } from "primereact/tooltip";
import { IPanel, panelGetStyle, panelReportSize } from "../panel/UIPanel";
import useComponents from "../../../hooks/components-hooks/useComponents";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import Dimension from "../../../util/types/Dimension";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import Layout from "../../layouts/Layout";
import { IComponentConstants } from "../../BaseComponent";

/**
 * This component displays a panel in which you will be able to scroll
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIScrollPanel: FC<IPanel & IComponentConstants> = (props) => {
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [, components, componentSizes] = useComponents(props.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference if a fixed amount of px (width) should be substracted if scrollbar appears */
    const minusWidth = useRef<boolean>(false);

    /** Reference if a fixed amount of px (height) should be substracted if scrollbar appears */
    const minusHeight = useRef<boolean>(false);

    /** The size of the panels layout */
    const [layoutSize, setLayoutSize] = useState<Dimension|undefined>(undefined)

    /** Removes 17px from width and/or height of the panel for the layout-calculation to make room for the scrollbar if a scrollbar is needed */
    const scrollStyle = useMemo(() => {
        let s:React.CSSProperties = panelGetStyle(false, props.layoutStyle, prefSize, props.screen_modal_ || props.content_modal_, props.screen_size_, props.context.transferType);
        minusWidth.current = false;
        minusHeight.current = false;
        if (layoutSize) {
            if (s.height !== undefined && (s.height as number) < layoutSize.height) {
                s.height = layoutSize.height;
                minusWidth.current = true;
            }

            if (s.width !== undefined && (s.width as number) < layoutSize.width) {
                s.width = layoutSize.width;
                minusHeight.current = true;
            }

            if (minusWidth.current) {
                (s.width as number) -= 17;
            }

            if (minusHeight.current) {
                (s.height as number) -= 17;
            }
        }

        return s;

    }, [componentSizes, props.layoutStyle?.width, props.layoutStyle?.height, props.screen_modal_, props.content_modal_, layoutSize])

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = useCallback((prefSize:Dimension, minSize?:Dimension) => {
        setLayoutSize(prefSize)
        panelReportSize(
            id, 
            "P", 
            prefSize,
            props.className,
            props.styleClassNames,
            { height: 17, width: 17 },
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback,
            minusHeight.current,
            minusWidth.current
        )
    }, [onLoadCallback]);

    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                ref={props.forwardedRef}
                id={props.name}
                className={concatClassnames(
                    "rc-scrollpanel",
                    props.styleClassNames
                )}
                style={props.screen_modal_ || props.content_modal_
                    ? {
                        height: (prefSize?.height as number),
                        width: prefSize?.width,
                        overflow: 'auto',
                        ...(props.backgroundImage ? { '--backgroundImage': `url(${props.context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {})
                    }
                    : {
                        ...props.layoutStyle,
                        ...props.compStyle,
                        overflow: 'auto',
                        ...(props.backgroundImage ? { '--backgroundImage': `url(${props.context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {})
                    }
                }
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)}
            >
                <Layout
                    id={id}
                    name={props.name}
                    className={props.className}
                    layoutData={props.layoutData}
                    layout={props.layout}
                    preferredSize={parsePrefSize(props.preferredSize)}
                    minimumSize={parseMinSize(props.minimumSize)}
                    maximumSize={parseMaxSize(props.maximumSize)}
                    popupSize={parsePrefSize(props.screen_size_)}
                    reportSize={reportSize}
                    compSizes={componentSizes}
                    components={components}
                    alignChildrenIfOverflow={false}
                    style={scrollStyle}
                    parent={props.parent} />
            </div>
        </>
    )
}

export default UIScrollPanel