import { TCredentials } from "@/api/auth";
import { FormInput } from "@/components/FormInput";
import { Colors } from "@/constants/Colors";
import { useSession } from "@/contexts/ctx";
import { MyToast } from "@/ui/MyToast";
import { MaterialIcons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import * as Progress from "react-native-progress";

const LoginBanner = require("@/assets/images/banner-login.png");

const Login = () => {
  const [showPw, setShowPw] = useState(false);
  const { signIn } = useSession();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<TCredentials>({ defaultValues: { identifyCard: "", password: "" } });

  const onToggleShowPw = () => {
    setShowPw(!showPw);
  };

  const onLogin = async (data: TCredentials) => {
    try {
      await signIn(data);
      // Navigate after signing in. You may want to tweak this to ensure sign-in is
      // successful before navigating.
      MyToast.success("Đăng nhập thành công");
      router.replace("/");
    } catch (error: any) {
      if (error instanceof Error) MyToast.error(error.message);
      else MyToast.error(JSON.stringify(error));
    }
  };

  const navigation = useNavigation();

  useEffect(() => {
    console.log("Login Screen Rendered !");
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
  return (
    <View style={{ padding: 16 }}>
      <View style={{ height: 48 }} />

      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Image source={LoginBanner} style={{ opacity: 0.5 }} />
      </View>

      <View style={{ height: 32 }} />

      <Text style={{ fontFamily: "Nunito", fontWeight: 800, fontSize: 16, alignSelf: "center" }}>Đăng nhập</Text>

      {/*  */}
      <View style={{ height: 16 }} />

      {/* Input_1 - Identify Card  */}
      <FormInput
        formInputProps={{ control: control, name: "identifyCard" }}
        placeholder="Nhập số CCCD..."
        leftIcon={<AntDesign name="idcard" size={18} color={Colors.light.inputIconNone} />}
      />
      {/* Input_2 - Password */}
      <FormInput
        formInputProps={{ control: control, name: "password" }}
        secureTextEntry={!showPw}
        placeholder="Nhập mật khẩu..."
        leftIcon={<MaterialIcons name="password" size={18} color={Colors.light.inputIconNone} />}
        rightIconEl={
          <Pressable onPress={onToggleShowPw}>
            <View style={{ padding: 8 }}>
              <Feather name={showPw ? "eye-off" : "eye"} size={18} color={Colors.light.inputIconNone} />
            </View>
          </Pressable>
        }
      />

      {/*  */}
      <View style={{ height: 16 }} />
      {/* Button - Login */}
      <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit(onLogin)} disabled={isSubmitting}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#0B3A82",
            height: 44,
            width: "100%",
            borderRadius: 4,
            gap: 8,
          }}
        >
          {isSubmitting && <Progress.Circle indeterminate size={14} />}
          <Text style={{ fontFamily: "Nunito", color: "white", fontWeight: 600, fontSize: 14 }}>Đăng nhập</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default Login;
