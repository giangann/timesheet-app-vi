import * as Progress from "react-native-progress";
import { fetchTodayTimeKeeping, fetchWorkingTypes } from "@/api/time-keeping";
import { NunitoText } from "@/components/text/NunitoText";
import { OPACITY_TO_HEX } from "@/constants/Colors";
import { ROLE_CODE } from "@/constants/Misc";
import { useSession } from "@/contexts/ctx";
import { AvatarByRole } from "@/ui/AvatarByRole";
import { MyCheckRadio } from "@/ui/MyCheckRadio";
import { MyToast } from "@/ui/MyToast";
import { useFocusEffect } from "expo-router";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

type TWorkingType = {
  id: number;
  name: string;
};

type TTimeKeepingMember = {
  name: string;
  identifyCard: string;
  roleId: number;
  roleName: string;
  roleCode: ROLE_CODE;
  workingTypeId: number | null;
  workingTypeName: string | null;
};

type TTimeKeepingMemberEdit = {
  userIdentifyCard: string;
  workingTypeId: number;
};

export default function TodayTimeKeeping() {
  const [workingTypes, setWorkingTypes] = useState<TWorkingType[]>([]);
  const [memberList, setMemberList] = useState<TTimeKeepingMember[]>([]);
  const [editTimeKeepingMembers, setEditTimeKeepingMembers] = useState<TTimeKeepingMemberEdit[]>([]);
  const [selectedIdCards, setSelectedIdCards] = useState<string[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const disabledUpdate = editTimeKeepingMembers.length <= 0 || isSaving;
  const [isSelectAll, setIsSelectAll] = useState(false);
  const { session } = useSession();

  const onSaveTimeKeeping = async () => {
    try {
      setIsSaving(true);
      const bodyData = {
        date: moment(Date.now()).format("YYYY-MM-DD"),
        users: [...editTimeKeepingMembers],
      };
      console.log(bodyData);

      const token = `Bearer ${session}` ?? "xxx";
      const baseUrl = "http://13.228.145.165:8080/api/v1";
      const endpoint = "/timekeeping";
      const url = `${baseUrl}${endpoint}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify(bodyData),
        credentials: "include",
      });
      const responseJson = await response.json();

      if (responseJson.statusCode === 200) {
        MyToast.success("Thành công");
      } else {
        MyToast.error(responseJson.error);
      }
    } catch (error: any) {
      MyToast.error(error.message);
    } finally {
      setEditTimeKeepingMembers([]);
      setIsSaving(false);

      fetchTodayTk();
    }
  };

  const onToggleEdit = () => {
    setIsEdit(!isEdit);
    setSelectedIdCards([]);
    setIsSelectAll(false);
  };

  const onChooseSelectAll = () => {
    const newSelectedIdCards = memberList.map((member) => member.identifyCard);
    setSelectedIdCards([...newSelectedIdCards]);

    setIsSelectAll(true);
  };

  const onChooseUnselectAll = () => {
    setSelectedIdCards([]);
    setIsSelectAll(false);
  };

  const onEditTimeKeepingMember = (selectedWorkingTypeId: number) => {
    // create Map to save current editedTimeKeepingMembers
    const editedTKMap = new Map<string, TTimeKeepingMemberEdit>();
    editTimeKeepingMembers.forEach((tkMem) => editedTKMap.set(tkMem.userIdentifyCard, tkMem));

    // reflect selectedIdCards and workingTypeId to editTimeKeepingMembers
    const newTimeKeepingMembers: TTimeKeepingMemberEdit[] = selectedIdCards.map((idCard) => ({
      userIdentifyCard: idCard,
      workingTypeId: selectedWorkingTypeId,
    }));
    newTimeKeepingMembers.forEach((tkMem) => editedTKMap.set(tkMem.userIdentifyCard, tkMem));

    // Convert the map back to an array and update the state
    const newEditedTimeKeepingMembers: TTimeKeepingMemberEdit[] = Array.from(editedTKMap.values());
    setEditTimeKeepingMembers([...newEditedTimeKeepingMembers]);
  };

  const onUpdateMemberList = (selectedWorkingTypeId: number) => {
    // Find the selected working type or default to a fallback
    const selectedWorkingType: TWorkingType = workingTypes.find((wkType) => wkType.id === selectedWorkingTypeId) ?? {
      id: -1,
      name: "Unknown WkType",
    };

    // Create a map to store members by identifyCard
    const memberListMap = new Map<string, TTimeKeepingMember>();
    memberList.forEach((mem) => memberListMap.set(mem.identifyCard, mem));

    // Update the members in the map with the new workingType
    for (const idCard of selectedIdCards) {
      const mem = memberListMap.get(idCard);
      if (!mem) continue;

      const memUpdated: TTimeKeepingMember = {
        ...mem,
        workingTypeId: selectedWorkingType.id,
        workingTypeName: selectedWorkingType.name,
      };
      memberListMap.set(idCard, memUpdated);
    }

    // Convert the map back to an array and update the state
    const updatedMemList = Array.from(memberListMap.values());
    setMemberList([...updatedMemList]);
  };

  const onMarkWkType = (chooseWkTypeId: number) => {
    onEditTimeKeepingMember(chooseWkTypeId);
    onUpdateMemberList(chooseWkTypeId);
    onToggleEdit();
  };

  const updateSelectedIdCards = (method: "add" | "remove", selectedIdCard: string) => {
    if (method === "add") {
      setSelectedIdCards([...selectedIdCards, selectedIdCard]);
    }
    if (method === "remove") {
      const newSelectedIdCards = selectedIdCards.filter((idCard) => idCard !== selectedIdCard);
      setSelectedIdCards([...newSelectedIdCards]);
    }
  };

  const fetchWKTypes = async () => {
    const responseJson = await fetchWorkingTypes(session);
    if (responseJson.statusCode === 200) {
      setWorkingTypes(responseJson.data.workingTypes);
    } else {
      MyToast.error(responseJson.error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWKTypes();
    }, [])
  );

  const fetchTodayTk = async () => {
    const responseJson = await fetchTodayTimeKeeping(session);
    if (responseJson.statusCode === 200) {
      setMemberList(responseJson.data.timeKeeping.users);
    } else {
      MyToast.error(responseJson.error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodayTk();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* option bar */}
      {!isEdit && (
        <View style={styles.optionBarDefault}>
          <NunitoText type="body3">{moment(Date.now()).format("DD/MM/YYYY")}</NunitoText>
          {editTimeKeepingMembers.length > 0 && <NunitoText>{`${editTimeKeepingMembers.length} đã sửa`}</NunitoText>}
          <Pressable onPress={onToggleEdit} style={styles.editPressable}>
            <NunitoText type="body3" lightColor="#0B3A82">
              Sửa
            </NunitoText>
          </Pressable>
        </View>
      )}
      {isEdit && (
        <View style={styles.optionBarDefault}>
          <View style={styles.optionBarItemIsEdit}>
            <Pressable onPress={onToggleEdit} style={styles.editPressable}>
              <NunitoText type="body3" lightColor="#0B3A82">
                Thoát
              </NunitoText>
            </Pressable>
          </View>
          <View style={[styles.optionBarItemIsEdit, { flexGrow: 1.5 }]}>
            {selectedIdCards.length === 0 && <NunitoText>Chọn thành viên</NunitoText>}
            {selectedIdCards.length > 0 && <NunitoText>{selectedIdCards.length} đã chọn</NunitoText>}
          </View>
          <View style={styles.optionBarItemIsEdit}>
            {!isSelectAll && (
              <Pressable onPress={onChooseSelectAll} style={styles.editPressable}>
                <NunitoText type="body3" lightColor="#0B3A82">
                  Chọn tất cả
                </NunitoText>
              </Pressable>
            )}

            {isSelectAll && (
              <Pressable onPress={onChooseUnselectAll} style={styles.editPressable}>
                <NunitoText type="body3" lightColor="#0B3A82">
                  Bỏ chọn tất cả
                </NunitoText>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* member list */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {memberList.map((member, index) => (
          <MemberItem key={index} updateSelectedIdCards={updateSelectedIdCards} isEdit={isEdit} member={member} isSelectAll={isSelectAll} />
        ))}
      </ScrollView>

      {/* action bar */}
      {isEdit && (
        <View style={styles.actionBar}>
          {workingTypes.map((wkType) => (
            <Pressable key={wkType.id} onPress={() => onMarkWkType(wkType.id)}>
              <NunitoText type="body3" lightColor="#0B3A82">
                {wkType.name}
              </NunitoText>
            </Pressable>
          ))}
        </View>
      )}

      {!isEdit && (
        <TouchableOpacity onPress={onSaveTimeKeeping} disabled={disabledUpdate} activeOpacity={0.8} style={styles.buttonContainer}>
          <View style={disabledUpdate ? [styles.button, styles.buttonDisabled] : styles.button}>
            {isSaving && <Progress.Circle indeterminate size={14} />}
            <NunitoText type="body3" style={disabledUpdate ? [styles.buttonText, styles.buttonTextDisabled] : styles.buttonText}>
              Cập nhật
            </NunitoText>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

type MemberItemProps = {
  isEdit: boolean;
  member: TTimeKeepingMember;
  updateSelectedIdCards: (method: "add" | "remove", selectedIdCard: string) => void;
  isSelectAll: boolean;
};
const MemberItem: React.FC<MemberItemProps> = ({ isEdit, member, updateSelectedIdCards, isSelectAll }) => {
  const [selected, setSelected] = useState(false);

  const onToggleSelected = () => setSelected(!selected);

  const onSelect = () => {
    updateSelectedIdCards(selected ? "remove" : "add", member.identifyCard);
    onToggleSelected();
  };

  useEffect(() => {
    setSelected(false);
  }, [isEdit]);

  useEffect(() => {
    if (isSelectAll) {
      setSelected(true);
    } else {
      setSelected(false);
    }
  }, [isSelectAll]);
  return (
    <Pressable onPress={onSelect} disabled={!isEdit}>
      <View style={styles.memberItemContainer}>
        <View style={styles.memberInfoWrapper}>
          {isEdit && <MyCheckRadio checked={selected} />}
          <View style={styles.memberInfo}>
            {/* avatar */}
            <AvatarByRole role={member.roleCode} />

            {/* name, role */}
            <View>
              <NunitoText type="body3">{member.name}</NunitoText>
              <NunitoText type="body4" style={{ opacity: 0.75 }}>
                {member.roleName}
              </NunitoText>
            </View>
          </View>
        </View>

        <View style={styles.timekeepingStatus}>
          <NunitoText type="body4" style={{ opacity: 0.675 }}>
            {member.workingTypeName ?? "Chưa chấm"}
          </NunitoText>
        </View>
      </View>
    </Pressable>
  );
};

const optionBarStyle: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",

  paddingBottom: 16,
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 0,
    height: "100%",
  },
  optionBarDefault: {
    ...optionBarStyle,
  },
  optionBarIsEdit: {
    ...optionBarStyle,
  },
  optionBarItemIsEdit: {
    flexBasis: 1,
    flexGrow: 1,
  },
  editPressable: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 100,
  },
  memberItemContainer: {
    backgroundColor: `#0B3A82${OPACITY_TO_HEX["15"]}`,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  memberInfoWrapper: {
    flexDirection: "row",
    gap: 12,

    alignItems: "center",
    justifyContent: "space-between",
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 16,
  },
  timekeepingStatus: {},
  actionBar: {
    paddingVertical: 16,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 48,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white", // Optional: To give the button a distinct background
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B3A82",
    height: 44,
    borderRadius: 4,

    gap: 8,
    flexDirection: "row",
  },
  buttonDisabled: {
    backgroundColor: `#000000${OPACITY_TO_HEX["15"]}`,
  },
  buttonText: {
    color: "white",
  },
  buttonTextDisabled: {
    color: `#000000${OPACITY_TO_HEX["30"]}`,
  },
});
