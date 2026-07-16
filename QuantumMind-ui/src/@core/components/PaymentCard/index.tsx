import styles from "./styles.module.css";
import MakePayment from "./MakePayment/MakePayment";

export default function PaymentCard(props:any){
    var {planType , planInfo , theme , size , amount , msg ,instance ,  btnmsg , direction , takeUserInfo} = props;
    
    return(
        <div className={`${styles.parent} ${styles.wrapper} h-content`} >
            <div className={`${styles.card} ${styles[`${theme}`]} ${styles[`${direction}`]}`}>
                <div  className={`${styles.header}`}>
                    <img  src={`/wave${theme}.png`} />
                    <h1>{planType ? planType : "N/A"}</h1>
                </div>
                <div className={`${styles.cardBody} ${styles.flex} ${styles.cols}`}> 
                    <div>
                        {!msg ? 
                            <><h1><sup>₹</sup>{amount ?  amount : 0}</h1><span className={styles.small}>/Month</span></> 
                            :
                            <><h1><span className={styles.small}>{msg}</span></h1></> 
                        }
                        <ul className={`${styles.container} ${styles.flex} ${styles.cols}`}>
                        {planInfo ? planInfo.map((item:any , index:number)=>{
                            return  <li key={index}>{item.data}</li>;
                        }): "N/A"}
                        </ul>
                    </div>
                </div>
                <div className={styles.btnContainer}>
                        <button className={styles.btn} onClick={e=>{MakePayment()}}>
                            <span>
                                {btnmsg ? btnmsg : "Buy"}
                            </span>
                        </button>
                </div>
            </div>        
        </div>
    )
}