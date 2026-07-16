// ** React Imports
import { ReactNode, useEffect, useState } from 'react';

// ** Next Imports
import { useRouter } from 'next/router';

// ** Types
import type { AppAbility } from 'src/configs/acl';

// ** Context Imports

// ** Config Import

// ** Component Import
import BlankLayout from 'src/@core/layouts/BlankLayout';
import NotAuthorized from 'src/pages/401';

// ** Hooks
import { useSelector } from 'react-redux';
import { access } from 'src/helper/Access';
import { useAuth } from 'src/hooks/useAuth';
import { RootState } from 'src/store';
import { AccessTypesEnum } from 'src/utils';
interface AclGuardProps {
  children: ReactNode;

}

const AccessGuard = (props: AclGuardProps) => {
  // ** Props
  const {  children,  } = props;
console.log({children})
  const [ability, setAbility] = useState<AppAbility | undefined>(undefined);
  const { userData } = useSelector((state: RootState) => state.user);
  const [role, setRole] = useState('');
  useEffect(() => {
    if (userData && userData.role) {
      setRole(userData.role);
    }
  }, [userData]);
  // ** Hooks
  const auth = useAuth();
  const router = useRouter();
  //   console.log({route: router.route})


        // If user is logged in, build the ability for the user and render the page

  // Render Not Authorized component if the current user has limited access
  return (
    <BlankLayout>
      <NotAuthorized />
    </BlankLayout>
  );

  };
export default AccessGuard;
