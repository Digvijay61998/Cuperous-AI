export const UserInputValidationEnum = {
  EMAIL: "engage.email",
  PHONE: "engage.phone_number",
  NUMBER: "engage.number",
  DATE: "engage.date",
  ALPHANUMERIC: "engage.alphanumeric",
  ANY: "engage.any",
  COUNTRY: "engage.country",
  TEXT: "engage.text",
  YES_NO: "engage.yes_no",
  YES: "engage.yes",
  NO: "engage.no",
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
