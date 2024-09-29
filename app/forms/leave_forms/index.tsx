import { fetchMyLeaveForms } from "@/api/form";
import { TLeaveForm, TLeaveFormFilterParams } from "@/api/form/types";
import { NunitoText } from "@/components/text/NunitoText";
import { OPACITY_TO_HEX } from "@/constants/Colors";
import { DEFAULT_PAGI_PARAMS, FORM_STATUS } from "@/constants/Misc";
import { useSession } from "@/contexts/ctx";
import { TPageable, TPagiParams } from "@/types";
import { AvatarByRole } from "@/ui/AvatarByRole";
import { ChipStatus } from "@/ui/ChipStatus";
import { MyToast } from "@/ui/MyToast";
import SkeletonLoader from "@/ui/SkeletonLoader";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function LeaveForms() {
  const [leaveForms, setLeaveForms] = useState<TLeaveForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageable, setPageable] = useState<TPageable | null>(null);
  const isFirstRender = useRef(true);
  const pagiParamsRef = useRef<TPagiParams>(DEFAULT_PAGI_PARAMS);
  const filterParamsRef = useRef<TLeaveFormFilterParams>({});

  const { session } = useSession();

  const handleEndListReached = () => {
    if (!isLoading && (pageable?.currentPage ?? -2) < (pageable?.totalPages ?? 0) - 1) {
      // calculate new pagi (next page)
      const { page: currentPage, size } = pagiParamsRef.current;
      const newPagiParams: TPagiParams = { page: currentPage + 1, size };

      // fetch data with next page
      fetchAndUpdateListForms(newPagiParams);

      // update current pagi to new pagi (next page)
      pagiParamsRef.current = newPagiParams;
    }
  };

  const fetchAndUpdateListForms = async (pagiParams: TPagiParams) => {
    setIsLoading(true);
    try {
      const responseJson = await fetchMyLeaveForms(session, pagiParams, filterParamsRef.current);
      if (responseJson.statusCode === 200) {
        const moreLeaveForms = responseJson.data.leaveForms;
        setLeaveForms((prev) => [...prev, ...moreLeaveForms]);
        setPageable(responseJson.data.pageable);
      } else {
        MyToast.error(responseJson.error);
      }
    } catch (error: any) {
      MyToast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const pagiParams = pagiParamsRef.current;
    fetchAndUpdateListForms(pagiParams);

    setTimeout(() => {
      isFirstRender.current = false;
    }, 1000);
  }, []);

  const fetchAndOverrideListForms = async (pagiParams: TPagiParams) => {
    try {
      const responseJson = await fetchMyLeaveForms(session, pagiParams, filterParamsRef.current);
      if (responseJson.statusCode === 200) {
        const overrideLeaveForms = responseJson.data.leaveForms;
        setLeaveForms(overrideLeaveForms);
      } else {
        MyToast.error(responseJson.error);
      }
    } catch (error: any) {
      MyToast.error(error.message);
    }
  };
  useFocusEffect(
    useCallback(() => {
      // Fetch notifications only when navigating back to this screen, not on first render
      if (isFirstRender.current === false) {
        // Calculate pagi params
        const { page: currentPage, size } = pagiParamsRef.current;
        const overridePagiParams: TPagiParams = { page: 0, size: (currentPage + 1) * size };

        // Fetch and override list with pagi params
        fetchAndOverrideListForms(overridePagiParams);
      }
      // We still want to update the callback when pagiParams changes, but not trigger it
    }, [session]) // Only depend on `session` here, or any other non-changing dependencies
  );

  const reFetchListFormsWithFilter = async (pagiParams: TPagiParams, filterParams: TLeaveFormFilterParams) => {
    setIsLoading(true);
    try {
      // api call
      const responseJson = await fetchMyLeaveForms(session, pagiParams, filterParams);

      if (responseJson.statusCode === 200) {
        const formsWithFilter = responseJson.data.leaveForms;
        setLeaveForms(formsWithFilter);
        setPageable(responseJson.data.pageable);
      } else {
        MyToast.error(responseJson.error);
      }
    } catch (error: any) {
      MyToast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onStatusTabPress = (newStatus: FORM_STATUS | null | undefined) => {
    // update filter params
    filterParamsRef.current = { ...filterParamsRef.current, status: newStatus };
    // reset pagiParams:
    pagiParamsRef.current = DEFAULT_PAGI_PARAMS;

    reFetchListFormsWithFilter(pagiParamsRef.current, filterParamsRef.current);
  };

  return (
    <View style={styles.container}>
      <FilterBar filterParams={filterParamsRef.current} onStatusTabPress={onStatusTabPress} />
      <FlatList
        data={leaveForms}
        renderItem={({ item }) => <Item leaveForm={item} />}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleEndListReached}
        onEndReachedThreshold={0.15}
        ListFooterComponent={(pageable?.currentPage ?? -2) < (pageable?.totalPages ?? 0) - 1 ? <SkeletonLoader /> : <View style={{ height: 80 }} />}
        style={styles.flatList}
      />
      <ApplyNewForm />
    </View>
  );
}

type FilterBarProps = FilterStatusProps & FilterFieldsModalProps & { filterParams: TLeaveFormFilterParams };
const FilterBar = ({ onStatusTabPress, filterParams }: FilterBarProps) => {
  return (
    <View style={styles.filterBarContainer}>
      {/* Filter Status */}
      <ScrollView horizontal>
        <FilterStatus status={filterParams.status} onStatusTabPress={onStatusTabPress} />
      </ScrollView>
      {/* Filter Fields Button */}
      <FilterFieldsModal />
    </View>
  );
};

type FilterStatusProps = {
  onStatusTabPress: (newStatus: FORM_STATUS | null | undefined) => void;
  status?: FORM_STATUS | null;
};
const FilterStatus = ({ onStatusTabPress, status }: FilterStatusProps) => {
  console.log("status", status);

  const statusTabsArray = useMemo(
    () => [
      {
        name: "Tất cả",
        status: [null, undefined],
        tabStyles: {
          pressed: {
            borderColor: "#0B3A82",
            backgroundColor: "#0B3A82",
          },
          unpressed: {
            borderColor: "#0B3A82",
          },
        },
        textStyles: {
          pressed: {
            color: "white",
          },
          unpressed: {
            color: "#0B3A82",
          },
        },
      },
      {
        name: "Chờ phê duyệt",
        status: [FORM_STATUS.WATING_APPROVE],
        tabStyles: {
          pressed: {
            borderColor: "#F2A900",
            backgroundColor: "#F2A900",
          },
          unpressed: {
            borderColor: "#F2A900",
          },
        },
        textStyles: {
          pressed: {
            color: "white",
          },
          unpressed: {
            color: "#F2A900",
          },
        },
      },
      {
        name: "Chấp thuận",
        status: [FORM_STATUS.ACCEPTED],
        tabStyles: {
          pressed: {
            borderColor: "#067D4E",
            backgroundColor: "#067D4E",
          },
          unpressed: {
            borderColor: "#067D4E",
          },
        },
        textStyles: {
          pressed: {
            color: "white",
          },
          unpressed: {
            color: "#067D4E",
          },
        },
      },
      {
        name: "Từ chối",
        status: [FORM_STATUS.REJECTED],
        tabStyles: {
          pressed: {
            borderColor: "#C84851",
            backgroundColor: "#C84851",
          },
          unpressed: {
            borderColor: "#C84851",
          },
        },
        textStyles: {
          pressed: {
            color: "white",
          },
          unpressed: {
            color: "#C84851",
          },
        },
      },
    ],
    []
  );

  return (
    <View style={styles.statusTabsContainer}>
      {statusTabsArray.map((statusTab, index) => {
        return (
          <TouchableOpacity onPress={() => onStatusTabPress(statusTab.status[0])} key={index}>
            <View
              style={[styles.statusTabItem, statusTab.status.includes(status as never) ? statusTab.tabStyles.pressed : statusTab.tabStyles.unpressed]}
            >
              <NunitoText
                style={statusTab.status.includes(status as never) ? statusTab.textStyles.pressed : statusTab.textStyles.unpressed}
                type="body2"
              >
                {statusTab.name}
              </NunitoText>
            </View>
          </TouchableOpacity>
        );
      })}
      {/* <TouchableOpacity onPress={() => onStatusTabPress(undefined)}>
        <View style={[styles.statusTabItem, status === null || status === undefined ? { borderColor: "#0B3A82" } : { borderColor: "#0B3A82" }]}>
          <NunitoText lightColor="#0B3A82" darkColor="#0B3A82" type="body2">
            Tất cả
          </NunitoText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onStatusTabPress(FORM_STATUS.WATING_APPROVE)}>
        <View style={[styles.statusTabItem, { borderColor: "#F2A900" }]}>
          <NunitoText lightColor="#F2A900" darkColor="#F2A900" type="body2">
            Chờ phê duyệt
          </NunitoText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onStatusTabPress(FORM_STATUS.ACCEPTED)}>
        <View style={[styles.statusTabItem, { borderColor: "#067D4E" }]}>
          <NunitoText lightColor="#067D4E" darkColor="#067D4E" type="body2">
            Chấp thuận
          </NunitoText>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => onStatusTabPress(FORM_STATUS.REJECTED)}>
        <View style={[styles.statusTabItem, { borderColor: "#C84851" }]}>
          <NunitoText lightColor="#C84851" darkColor="#C84851" type="body2">
            Từ chối
          </NunitoText>
        </View>
      </TouchableOpacity> */}
    </View>
  );
};

type FilterFieldsModalProps = {};
const FilterFieldsModal = ({}: FilterFieldsModalProps) => {
  return (
    <TouchableOpacity>
      <View style={styles.filterIconWrapper}>
        <Ionicons name="filter" size={24} color="black" />
      </View>
    </TouchableOpacity>
  );
};

type ItemProps = {
  leaveForm: TLeaveForm;
};
const Item: React.FC<ItemProps> = ({ leaveForm }) => {
  const [isExpand, setIsExpand] = useState(false);
  const router = useRouter();

  const onGoToFormDetail = () => {
    router.navigate({
      pathname: "/forms/leave_forms/[id]",
      params: { id: leaveForm.id },
    });
  };

  const onToggleExpand = () => setIsExpand(!isExpand);

  return (
    <View style={styles.itemBox}>
      {/* sumary */}
      <Pressable onPress={onGoToFormDetail}>
        <View style={styles.itemBoxSumary}>
          <View style={styles.userInfo}>
            <AvatarByRole role={leaveForm.userApproveRole.code} />
            <View style={{ gap: 4 }}>
              <NunitoText type="body3">{leaveForm.userApproveName}</NunitoText>
              <NunitoText type="body4" style={{ opacity: 0.75 }}>
                {leaveForm.userApproveRole.name}
              </NunitoText>
            </View>
          </View>
          <View style={styles.formInfo}>
            <ChipStatus status={leaveForm.status} />
            <View>
              <View>
                <NunitoText type="body4" style={{ opacity: 0.675 }}>
                  {moment(leaveForm.startDate).format("DD/MM/YYYY HH:mm")}
                </NunitoText>
                <NunitoText type="body4" style={{ opacity: 0.675 }}>
                  {moment(leaveForm.endDate).format("DD/MM/YYYY HH:mm")}
                </NunitoText>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Extra info, only display when expand is true */}
      {isExpand && (
        <View style={styles.extraInfo}>
          <NunitoText type="body4">
            <NunitoText type="body2">Loại nghỉ: </NunitoText>
            {leaveForm.leaveFormTypeName}
          </NunitoText>

          <NunitoText type="body4">
            <NunitoText type="body2">Ghi chú: </NunitoText>
            {leaveForm.note}
          </NunitoText>

          {leaveForm.approveDate && (
            <NunitoText type="body4">
              <NunitoText type="body2">Phê duyệt lúc: </NunitoText>
              {moment(leaveForm.approveDate).format("DD/MM/YYYY HH:mm")}
            </NunitoText>
          )}
        </View>
      )}

      {/* expand button */}
      <Pressable onPress={onToggleExpand}>
        <View style={styles.itemExpandBtn}>
          <Entypo name={isExpand ? "chevron-up" : "chevron-down"} size={22} color="black" />
        </View>
      </Pressable>
    </View>
  );
};

const ApplyNewForm = () => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push("/forms/leave_forms/create-leave-form")} activeOpacity={0.8} style={styles.buttonContainer}>
      <View style={styles.button}>
        <NunitoText type="body3" style={{ color: "white" }}>
          Tạo đơn mới
        </NunitoText>
      </View>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    backgroundColor: "white",
    minHeight: "100%",
    height: "100%",
    /**
     * if not set height 100%, container will overflow screen,
     * so scrollView will fill container => scrollView also overflow screen
     * => can't see all element inside scrollView
     */
  },

  // filter bar here:
  filterBarContainer: {
    marginVertical: 16,
    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },
  statusTabsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusTabItem: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 12,

    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterIconWrapper: {},
  //
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
    marginBottom: 20,
  },
  flatList: {},
  itemBox: {
    borderRadius: 8,
    borderColor: "#B0CEFF",
    borderWidth: 1,
    //
    marginBottom: 20,
  },
  itemBoxSumary: {
    backgroundColor: "#EFF5FF",
    paddingVertical: 16,
    paddingHorizontal: 12,

    flexDirection: "row",
    justifyContent: "space-between",

    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  userInfo: {
    justifyContent: "space-between",
    gap: 16,
  },
  userAvatar: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${OPACITY_TO_HEX["15"]}`,
  },
  formInfo: {
    justifyContent: "space-between",
  },
  extraInfo: {
    padding: 16,
    gap: 10,
  },
  itemExpandBtn: {
    backgroundColor: "#B0CEFF",
    alignItems: "center",
    paddingVertical: 0,

    borderBottomLeftRadius: 8,
    borderBottomStartRadius: 6,
    borderBottomEndRadius: 6,
    borderBottomRightRadius: 8,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    borderRadius: 4,
    backgroundColor: "#0B3A82",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // For Android shadow
  },
});
