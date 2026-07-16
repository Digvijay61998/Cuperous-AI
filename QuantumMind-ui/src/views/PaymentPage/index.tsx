import React from "react";
import  Typography  from "@mui/material/Typography";
import  Container from "@mui/material/Container";
import  Button from "@mui/material/Button";
import MakePayment, { PaymentArgs } from "src/@core/components/PaymentCard/MakePayment/MakePayment";
import env from "../../configs/payments";

export const PricingPage: React.FC = () => {

  const handlePayment = async ()=>{
    //  let paymentInfo:PaymentArgs = {
    //   userId : "" , 
    //   userName : ""  , 
    //   contact : 7020133338, 
    //   count : "12" , 
    //   ServiceName : "BizzBot-service" , 
    //   plan_id  : env.plan_id , 
    //   Status : "pending" , 
    //   email : "leeparker0910@gmail.com" , 
    //   Amount : 599999 ,
    //   paymentParthner : "Razorpay" ,
    //   is_subscription : true
    //  }
    //  MakePayment();
  }


  return (
    <Container maxWidth="sm" style={{ textAlign: "center", marginTop: "2rem" }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Pricing Plans
      </Typography>
      <Typography variant="body1" component="p" gutterBottom>
        Choose a plan that fits your nee`ds.
      </Typography>

      <div style={{ margin: "2rem 0" }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Basic Plan
        </Typography>
        <Typography variant="body1" component="p">
          $10/month
        </Typography>
        <Typography variant="body2" component="p" color="textSecondary">
          Access to basic features
        </Typography>
      </div>

      <div style={{ margin: "2rem 0" }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Premium Plan
        </Typography>
        <Typography variant="body1" component="p">
          $20/month
        </Typography>
        <Typography variant="body2" component="p" color="textSecondary">
          Access to all features
        </Typography>
      </div>

      <Button 
        variant="contained" 
        color="primary" 
        size="large"
        onClick={MakePayment}
      >
        Pay Now
      </Button>
    </Container>
  );
};
