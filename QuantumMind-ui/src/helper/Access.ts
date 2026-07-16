import { RoleEnum, AccessTypesEnum } from 'src/utils';
const blockedPathForAgent = [
  '/agent',
  '/webhooks',
  '/segments',
  '/tag',
  '/bots/bot-flow/',
  // "/dashboards/",
  '/social/list'
];
const isInclude = (path: string, arr: string[]) => {  
  for (let i = 0; i < arr.length; i++) {
    if (path.includes(arr[i])) {
      return true;
    }
  }
};
export const access = (role: string, type: string, path?: string) => {
  if (role === RoleEnum.ADMIN) {
    // if (type === AccessTypesEnum.READ) {
    //   if (path) {
    //     if (!isInclude(path, blockedPathForAgent)) {
    //       return true;
    //     }
    //   }
    // } else if (type === AccessTypesEnum.CREATE) {
    //   return false;
    // } else if (type === AccessTypesEnum.UPDATE) {
    //   return false;
    // } else if (type === AccessTypesEnum.DELETE) {
    //   return true;
    // } else if (type === AccessTypesEnum.ACTION) {
    //   return false;
    // } else {
    //   return false;
    // }
    return true
  }
  if (role === RoleEnum.AGENT) {
    if (type === AccessTypesEnum.VIEW) {
      if (path) {
        if (isInclude(path, blockedPathForAgent)) {
          return true;
        }
      }
    } 
    if (type === AccessTypesEnum.READ) {
      if (path) {
        if (!isInclude(path, blockedPathForAgent)) {
          return true;
        }
      }
    } else if (type === AccessTypesEnum.CREATE) {
      return false;
    } else if (type === AccessTypesEnum.UPDATE) {
      return false;
    } else if (type === AccessTypesEnum.DELETE) {
      return true;
    } else if (type === AccessTypesEnum.ACTION) {
      return false;
    } else {
      return false;
    }
  }
  if (role === RoleEnum.CREATOR) {
    if (type === AccessTypesEnum.READ) {
      return true;
    } else if (type === AccessTypesEnum.CREATE) {
      return true;
    } else if (type === AccessTypesEnum.UPDATE) {
      return true;
    } else if (type === AccessTypesEnum.UPDATE) {
      return true;
    } else {
      return false;
    }
  }
  if (role === RoleEnum.AUDITOR) {
    if (type === AccessTypesEnum.READ) {
      return true;
    } else if (type === AccessTypesEnum.CREATE) {
      return true;
    } else if (type === AccessTypesEnum.UPDATE) {
      return true;
    } else {
      return false;
    }
  }
  if (role === RoleEnum.MANAGEMENT) {
    if (type === AccessTypesEnum.READ) {
      return true;
    } else if (type === AccessTypesEnum.CREATE) {
      return true;
    } else {
      return false;
    }
  }
  return false;
};
