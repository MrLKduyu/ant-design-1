import * as React from 'react';
import RcDropdown from 'rc-dropdown';
import classNames from 'classnames';
import RightOutlined from '@ant-design/icons/RightOutlined';
import DropdownButton from './dropdown-button';
import { ConfigContext } from '../config-provider';
import devWarning from '../_util/devWarning';
import { tuple } from '../_util/type';
import { cloneElement } from '../_util/reactNode';
import getPlacements from '../_util/placements';

const Placements = tuple(
  'topLeft',
  'topCenter',
  'topRight',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'top',
  'bottom',
);

type Placement = typeof Placements[number];

type OverlayFunc = () => React.ReactElement;

type Align = {
  points?: [string, string];
  offset?: [number, number];
  targetOffset?: [number, number];
  overflow?: {
    adjustX?: boolean;
    adjustY?: boolean;
  };
  useCssRight?: boolean;
  useCssBottom?: boolean;
  useCssTransform?: boolean;
};

export type DropdownArrowOptions = {
  pointAtCenter?: boolean;
};

export interface DropDownProps {
  arrow?: boolean | DropdownArrowOptions;
  trigger?: ('click' | 'hover' | 'contextMenu')[];
  overlay: React.ReactElement | OverlayFunc;
  onVisibleChange?: (visible: boolean) => void;
  visible?: boolean;
  disabled?: boolean;
  destroyPopupOnHide?: boolean;
  align?: Align;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  prefixCls?: string;
  className?: string;
  transitionName?: string;
  placement?: Placement;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  forceRender?: boolean;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  openClassName?: string;
}

interface DropdownInterface extends React.FC<DropDownProps> {
  Button: typeof DropdownButton;
}

const Dropdown: DropdownInterface = props => {
  const {
    getPopupContainer: getContextPopupContainer,
    getPrefixCls,
    direction,
  } = React.useContext(ConfigContext);

  const getTransitionName = () => {
    const rootPrefixCls = getPrefixCls();
    const { placement = '', transitionName } = props;
    if (transitionName !== undefined) {
      return transitionName;
    }
    if (placement.indexOf('top') >= 0) {
      return `${rootPrefixCls}-slide-down`;
    }
    return `${rootPrefixCls}-slide-up`;
  };

  const renderOverlay = (prefixCls: string) => {
    // rc-dropdown already can process the function of overlay, but we have check logic here.
    // So we need render the element to check and pass back to rc-dropdown.
    const { overlay } = props;

    let overlayNode;
    if (typeof overlay === 'function') {
      overlayNode = (overlay as OverlayFunc)();
    } else {
      overlayNode = overlay;
    }
    overlayNode = React.Children.only(
      typeof overlayNode === 'string' ? <span>{overlayNode}</span> : overlayNode,
    );

    const overlayProps = overlayNode.props;

    // Warning if use other mode
    devWarning(
      !overlayProps.mode || overlayProps.mode === 'vertical',
      'Dropdown',
      `mode="${overlayProps.mode}" is not supported for Dropdown's Menu.`,
    );

    // menu cannot be selectable in dropdown defaultly
    const { selectable = false, expandIcon } = overlayProps;

    const overlayNodeExpandIcon =
      typeof expandIcon !== 'undefined' && React.isValidElement(expandIcon) ? (
        expandIcon
      ) : (
        <span className={`${prefixCls}-menu-submenu-arrow`}>
          <RightOutlined className={`${prefixCls}-menu-submenu-arrow-icon`} />
        </span>
      );

    const fixedModeOverlay =
      typeof overlayNode.type === 'string'
        ? overlayNode
        : cloneElement(overlayNode, {
            mode: 'vertical',
            selectable,
            expandIcon: overlayNodeExpandIcon,
          });

    return fixedModeOverlay as React.ReactElement;
  };

  const getPlacement = () => {
    const { placement } = props;
    if (!placement) {
      return direction === 'rtl' ? ('bottomRight' as Placement) : ('bottomLeft' as Placement);
    }

    if (placement.includes('Center')) {
      const newPlacement = placement.slice(0, placement.indexOf('Center'));
      devWarning(
        !placement.includes('Center'),
        'Dropdown',
        `You are using '${placement}' placement in Dropdown, which is deprecated. Try to use '${newPlacement}' instead.`,
      );
      return newPlacement;
    }

    return placement;
  };

  const {
    arrow,
    prefixCls: customizePrefixCls,
    children,
    trigger,
    disabled,
    getPopupContainer,
    overlayClassName,
  } = props;

  const prefixCls = getPrefixCls('dropdown', customizePrefixCls);
  const child = React.Children.only(children) as React.ReactElement<any>;

  const dropdownTrigger = cloneElement(child, {
    className: classNames(
      `${prefixCls}-trigger`,
      {
        [`${prefixCls}-rtl`]: direction === 'rtl',
      },
      child.props.className,
    ),
    disabled,
  });

  const overlayClassNameCustomized = classNames(overlayClassName, {
    [`${prefixCls}-rtl`]: direction === 'rtl',
  });

  const triggerActions = disabled ? [] : trigger;
  let alignPoint;
  if (triggerActions && triggerActions.indexOf('contextMenu') !== -1) {
    alignPoint = true;
  }

  const builtinPlacements = getPlacements({
    arrowPointAtCenter: typeof arrow === 'object' && arrow.pointAtCenter,
  });

  return (
    <RcDropdown
      alignPoint={alignPoint}
      {...props}
      builtinPlacements={builtinPlacements}
      arrow={!!arrow}
      overlayClassName={overlayClassNameCustomized}
      prefixCls={prefixCls}
      getPopupContainer={getPopupContainer || getContextPopupContainer}
      transitionName={getTransitionName()}
      trigger={triggerActions}
      overlay={() => renderOverlay(prefixCls)}
      placement={getPlacement()}
    >
      {dropdownTrigger}
    </RcDropdown>
  );
};

Dropdown.Button = DropdownButton;

Dropdown.defaultProps = {
  mouseEnterDelay: 0.15,
  mouseLeaveDelay: 0.1,
};

export default Dropdown;
