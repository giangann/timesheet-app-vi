import {
  Image,
  ImageStyle,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableHighlight,
  View,
  ViewStyle,
  type TextInputProps,
  Pressable,
} from "react-native";
import { FieldValues, UseControllerProps, useController } from "react-hook-form";
import { useState } from "react";
import { OPACITY_TO_HEX } from "@/constants/Colors";
import { NunitoText } from "./text/NunitoText";
const ArrowDownSelectIconImage = require("@/assets/images/arrow-down-select.png");
const LeaveTypeIconLeft = require("@/assets/images/identify-card.png");

type TOption = {
  value: any;
  label: string;
} & Record<string, unknown>;

type FormSelectProps<T extends FieldValues> = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  options: TOption[];
  optionRender?: (opt: TOption) => React.ReactNode;
} & {
  useControllerProps: UseControllerProps<T>;
};

export function FormSelect<T extends FieldValues>({ useControllerProps, options, label, required, placeholder }: FormSelectProps<T>) {
  const [openModal, setOpenModal] = useState(false);
  const [labelOfValue, setLabelOfValue] = useState<string | null>(null);
  const { field } = useController(useControllerProps);
  const { value, onChange } = field;

  const onToggleOpenModal = () => setOpenModal(!openModal);

  const onSelect = (value: any, label: string) => {
    // update value
    onChange(value);

    // update display label of value
    setLabelOfValue(label);

    // close modal
    setOpenModal(false);
  };

  return (
    <View style={styles.container}>
      {/* label */}
      <View style={styles.labelWrapper}>
        {label && (
          <NunitoText type="body2" style={{ marginRight: 6 }}>
            {label}
          </NunitoText>
        )}
        {required && <Text style={{ color: "red" }}>*</Text>}
      </View>

      {/* select button*/}
      <Pressable onPress={onToggleOpenModal}>
        <View style={styles.showChooseValueBox}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* left icon */}
            <Image source={LeaveTypeIconLeft} style={{ ...imageStyles.icon }} />

            {/* value */}
            <>
              {!value && (
                <NunitoText type="body3" style={{ opacity: 0.5 }}>
                  Select
                </NunitoText>
              )}
              {value && <Text>{labelOfValue}</Text>}
            </>
          </View>

          {/* right icon - arrow*/}
          <Image source={ArrowDownSelectIconImage} style={{ ...imageStyles.icon }} />
        </View>
      </Pressable>

      {/* select modal */}
      {openModal && (
        // modal
        <View style={{ padding: 10, backgroundColor: `#000000${OPACITY_TO_HEX["10"]}` }}>
          {options.length <= 0 && <NunitoText type="body3">No options</NunitoText>}
          {options.length > 0 && (
            <>
              {options.map((opt) => (
                //item
                <Pressable key={opt.value} onPress={() => onSelect(opt.value, opt.label)}>
                  <NunitoText type="body3">{opt.label}</NunitoText>
                </Pressable>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * -------------------------------------------
 */

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelWrapper: {
    flexDirection: "row",
    alignContent: "flex-start",
    alignItems: "center",
  },
  showChooseValueBox: {
    padding: 10,
    borderWidth: 1,
    height: 40,
    borderRadius: 4,
    borderColor: `#000000${OPACITY_TO_HEX["20"]}`,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
});
/**
 * --------------------------------------------
 */

const baseSelectInputStyle: ViewStyle | TextStyle | ImageStyle = {
  padding: 10,
  paddingLeft: 36,
  paddingRight: 36,
  borderWidth: 1,
  height: 40,
  borderRadius: 4,
  fontFamily: "Nunito",
};

const selectInputStyles = StyleSheet.create({
  default: {
    ...baseSelectInputStyle,
  },
  error: {
    ...baseSelectInputStyle,
    borderColor: "red",
  },
});

const imageStyles = StyleSheet.create({
  icon: {
    opacity: 0.5,
  },
});
