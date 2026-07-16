import { Fragment ,ReactNode,useEffect,useState} from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import dynamic from 'next/dynamic'
import BlankLayout from "src/@core/layouts/BlankLayout";

import { PricingPage } from "src/views/PaymentPage";
export default function Payment() {
    return (
        <Fragment>
            <Head>
                <title>Afforable pricing for all document templates</title>
                <meta
                    name="description"
                    content="Docdedo, the only affordable,free document template management tool for all best HR, Entreprenuear and Legal advisors."
                />
                <meta name="google-site-verification" content="Yod4saCe8iK1TDthYNGo2Gebqdw9w84_E8qLfmCCpA4" />
                <meta name="robots" content="index,follow" />
                <meta name="googlebot" content="index,follow" />
                <link rel="shortcut icon" href="/Blue 2-8.png" />
            </Head>
            <PricingPage />
        </Fragment>
    );
}


Payment.getLayout = (page:ReactNode)=><BlankLayout>{page}</BlankLayout>