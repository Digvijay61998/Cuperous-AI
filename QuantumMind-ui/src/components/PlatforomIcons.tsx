import Icon from 'src/@core/components/icon';

export default function returnPlatformIcon(platform: string) {
    if(platform?.toLowerCase() === 'telegram') {
      return <Icon icon={'logos:telegram'} fontSize='20'/>
    } else if(platform?.toLowerCase() === 'whatsapp') {
      return <Icon icon={'logos:whatsapp-icon'} fontSize='20'/>
    } else if(platform?.toLowerCase() === 'whatsapp_web') {
      return <Icon icon={'logos:whatsapp-icon'} fontSize='20'/>
    } else if(platform?.toLowerCase() === 'facebook') {
      return <Icon icon={'logos:facebook'} fontSize='20'/>
    } else if(platform?.toLowerCase() === 'widget') {
      return <Icon icon={'icon-park:robot-one'} fontSize='20'/>
    } else if(platform?.toLowerCase() === 'viber') {
      return <Icon icon={'simple-icons:viber'} color='#8e69fb' fontSize='20'/>
    } else if(platform?.toLowerCase() === 'instagram') {
      return <Icon icon={'skill-icons:instagram'}  fontSize='20'/>
    } else {
      return <Icon icon={'pajamas:severity-unknown'} fontSize='20'/>
    }
  };