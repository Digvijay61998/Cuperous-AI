import axios, { Axios, AxiosResponse } from 'axios';

import env from "../../../../configs/payments";
import { paymentInstane } from 'src/helper/Axios';
import Snackbar from 'src/@core/theme/overrides/snackbar';
import Alert from 'src/@core/theme/overrides/alerts';

export interface PaymentArgs{
  userId: string , 
  userName : string  , 
  contact  : number  , 
  ServiceName : string  , 
  count : string , 
  plan_id : string , 
  Status : string , 
  email : string , 
  Amount  : number , 
  paymentParthner : string , 
  is_subscription  :boolean
}

export default async function MakePayment() {
  console.log("MAKE PAYMENT CALLED HERE");
  var paymentInfo:PaymentArgs = {
    userId : "" , 
    userName : ""  , 
    contact : 7020133338, 
    count : "12" , 
    ServiceName : "BizzBot-service" , 
    plan_id  : env.plan_id , 
    Status : "pending" , 
    email : "leeparker0910@gmail.com" , 
    Amount : 599999 ,
    paymentParthner : "Razorpay" ,
    is_subscription : true
  }

  var paymentResponse:AxiosResponse;

  const loadScript = (src:any) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
    document.body.appendChild(script);
  });
  };

 
  async function CreateTransaction(data:any){
    const TransactionArgs = {
      paymentId:data._id, 
      transaction_id: data.razorpay.id,                  //Stands for payment id or the  order ID
      userid: data.userId,  
      amount: paymentInfo.Amount,                                     //Need Fixing for the amount 
      serviceName: data.ServiceName,
      status : data.Status
    }
    // let results  = await PAYMENT_MS.APIS.TRANSACATION_POST(TransactionArgs);
    await paymentInstane(
      {
        url : "/transactions" , 
        method  : "POST" ,  
        data :  TransactionArgs
      }
    )
    // return results;
  }

  async function HandlePayment(response:any){  
  console.log("Incoming data " ,  paymentResponse);
  let {data} = paymentResponse
  data.razorpay.verify = {
    id: response.razorpay_subscription_id,
    //id: response.razorpay_order_id,
    signature: response.razorpay_signature,
    payment_id: response.razorpay_payment_id,
    verify: false,
  };
  Object.assign(data , {"Amount"  : paymentInfo.Amount});       //Allocate the amount the user just paid for Status 
  const result = await paymentInstane(
    {
      url : "/userpayments/verify" , 
      method : "PUT" , 
      data : data
    }
  );
  if(result.data.razorpay.verify.verified){
    // Notification("Payment done successfully!!", "success");
    console.log("Payment Completed ");
    await CreateTransaction(result.data);
  }else{
    // Notification("Payment Failed", "failure");
    console.log("Payment Failed");
    await CreateTransaction(result.data);
  }  
 }
 
  async function Init(){
    
    paymentResponse = await paymentInstane(
        {
          url : "/userpayments" , 
          method : "POST" , 
          data : paymentInfo
        }
    )
    let {data} = paymentResponse
    // console.log("This Called " ,data);        
    if (!data) {
        return; 
    }
    console.log("This Called here " , data);
    var RAZORPAY_OPTIONS = {
      key: env.apikey, // Enter the Key ID generated from the Dashboard
      currency: "INR",
      name: "Docdedo .",
      description: `Payment for`,
      subscription_id: data.razorpay.id ,
      // order_id: data.razorpay.Order.id,
      handler:  async function(response:any){
        await HandlePayment(response)
        // takeUserInfo(true);     //State for taking user info    Manage this when user is not siged in 
      },
  
      prefill: {
        name: data.userName,
        email: data.email,
        contact: data.contact,
      },
      notes: {
        address: "Soumya Dey Corporate Office",
      },
      theme: {
        color: "#61dafb",
      },
    };
    loadScript("https://checkout.razorpay.com/v1/checkout.js").then(()=>{
      const paymentObject = new (window as any).Razorpay(RAZORPAY_OPTIONS);
      paymentObject.open();
    });
  }

  Init()
}
