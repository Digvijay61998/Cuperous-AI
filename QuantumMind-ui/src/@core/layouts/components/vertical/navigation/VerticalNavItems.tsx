import { useEffect, useState } from 'react';
// ** Type Imports
import {
  NavLink,
  NavGroup,
  LayoutProps,
  NavSectionTitle,
} from 'src/@core/layouts/types';

// ** Custom Menu Components
import VerticalNavLink from './VerticalNavLink';
import VerticalNavGroup from './VerticalNavGroup';
import VerticalNavSectionTitle from './VerticalNavSectionTitle';
import { access } from 'src/helper/Access';
import { useAuth } from 'src/hooks/useAuth';
import { AccessTypesEnum } from 'src/utils';
interface Props {
  parent?: NavGroup;
  navHover?: boolean;
  navVisible?: boolean;
  groupActive: string[];
  isSubToSub?: NavGroup;
  currentActiveGroup: string[];
  navigationBorderWidth: number;
  settings: LayoutProps['settings'];
  saveSettings: LayoutProps['saveSettings'];
  setGroupActive: (value: string[]) => void;
  setCurrentActiveGroup: (item: string[]) => void;
  verticalNavItems?: LayoutProps['verticalLayoutProps']['navMenu']['navItems'];
}

const resolveNavItemComponent = (
  item: NavGroup | NavLink | NavSectionTitle,
) => {
  if ((item as NavSectionTitle).sectionTitle) return VerticalNavSectionTitle;
  if ((item as NavGroup).children) return VerticalNavGroup;

  return VerticalNavLink;
};

const VerticalNavItems = (props: Props) => {
  // ** Props
  const { verticalNavItems } = props;
  const auth = useAuth();
const [role, setRole] = useState<string>("")
  useEffect(() => {
    if (auth.user && auth.user.role) {
     setRole(auth.user.role)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const RenderMenuItems = verticalNavItems?.map(
    (item: any, index: number) => {
      const TagName: any = resolveNavItemComponent(item);
      return  access(role, AccessTypesEnum.READ, item?.path) && <TagName {...props} key={index} item={item} />;
    },
  );

  return <>{RenderMenuItems}</>;
};

export default VerticalNavItems;
