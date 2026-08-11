export const UserInputValidationEnum = {
  EMAIL: "jarcube.email",
  PHONE: "jarcube.phone_number",
  NUMBER: "jarcube.number",
  DATE: "jarcube.date",
  ALPHANUMERIC: "jarcube.alphanumeric",
  ANY: "jarcube.any",
  COUNTRY: "jarcube.country",
  TEXT: "jarcube.text",
  YES_NO: "jarcube.yes_no",
  YES: "jarcube.yes",
  NO: "jarcube.no",
} as const;

export type UserInputValidationEnum =
  (typeof UserInputValidationEnum)[keyof typeof UserInputValidationEnum];

export const ValidationInputList = [
  {
    value: UserInputValidationEnum.EMAIL,
    label: "Email",
  },
  {
    value: UserInputValidationEnum.PHONE,
    label: "Phone",
  },
  {
    value: UserInputValidationEnum.NUMBER,
    label: "Number",
  },
  {
    value: UserInputValidationEnum.DATE,
    label: "Date",
  },
  {
    value: UserInputValidationEnum.ALPHANUMERIC,
    label: "Alphanumeric",
  },
  {
    value: UserInputValidationEnum.ANY,
    label: "Any",
  },
  {
    value: UserInputValidationEnum.COUNTRY,
    label: "Country",
  },
  {
    value: UserInputValidationEnum.TEXT,
    label: "Text",
  },
  {
    value: UserInputValidationEnum.YES_NO,
    label: "Yes/No",
  },
  {
    value: UserInputValidationEnum.YES,
    label: "Yes",
  },
];
