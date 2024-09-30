import { fetchApproveOvertimeForms } from "@/api/form";
import { TApproveOvertimeForm, TApproveOvertimeFormFilterParams } from "@/api/form/types";
import { NunitoText } from "@/components/text/NunitoText";
import { OPACITY_TO_HEX } from "@/constants/Colors";
import { DEFAULT_PAGI_PARAMS, FORM_STATUS } from "@/constants/Misc";
import { useSession } from "@/contexts/ctx";
import { TPageable, TPagiParams } from "@/types";
import { AvatarByRole } from "@/ui/AvatarByRole";
import { ChipStatus } from "@/ui/ChipStatus";
import { MyToast } from "@/ui/MyToast";
import SkeletonLoader from "@/ui/SkeletonLoader";
import { useFocusEffect, useRouter } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Entypo from "@expo/vector-icons/Entypo";
import { FormPickDate } from "@/components/FormPickDate";
import { useForm } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { omitNullishValues, omitProperties } from "@/helper/common";
import { MyFilterModal } from "@/components/MyFilterModal";
import { NoData } from "@/ui/NoData";

export default function ApproveOvertimeForms() {
  const [overtimeForms, setOvertimeForms] = useState<TApproveOvertimeForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageable, setPageable] = useState<TPageable | null>(null);
  const isFirstRender = useRef(true);
  const pagiParamsRef = useRef<TPagiParams>(DEFAULT_PAGI_PARAMS);
  const filterParamsRef = useRef<TApproveOvertimeFormFilterParams>({});

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
      const responseJson = await fetchApproveOvertimeForms(session, pagiParams, filterParamsRef.current);
      if (responseJson.statusCode === 200) {
        const moreOvertimeForms = responseJson.data.overtimeForms;
        setOvertimeForms((prev) => [...prev, ...moreOvertimeForms]);
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
      const responseJson = await fetchApproveOvertimeForms(session, pagiParams, filterParamsRef.current);
      if (responseJson.statusCode === 200) {
        const overrideOvertimeForms = responseJson.data.overtimeForms;
        setOvertimeForms(overrideOvertimeForms);
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

  const reFetchListFormsWithFilter = async (pagiParams: TPagiParams, filterParams: TApproveOvertimeFormFilterParams) => {
    setIsLoading(true);
    try {
      // api call
      const responseJson = await fetchApproveOvertimeForms(session, pagiParams, filterParams);

      if (responseJson.statusCode === 200) {
        const formsWithFilter = responseJson.data.overtimeForms;
        setOvertimeForms(formsWithFilter);
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

  const onFilterFieldsChange = (newFilterParamsWihoutStatus: Omit<TApproveOvertimeFormFilterParams, "status">) => {
    // update filter params
    filterParamsRef.current = { status: filterParamsRef.current.status, ...newFilterParamsWihoutStatus };
    // reset pagiParams:
    pagiParamsRef.current = DEFAULT_PAGI_PARAMS;

    reFetchListFormsWithFilter(pagiParamsRef.current, filterParamsRef.current);
  };

  return (
    <View style={styles.container}>
      <FilterBar filterParams={filterParamsRef.current} onStatusTabPress={onStatusTabPress} onFilterFieldsChange={onFilterFieldsChange} />

      <FlatList
        data={overtimeForms}
        renderItem={({ item }) => <Item overtimeForm={item} />}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={handleEndListReached}
        onEndReachedThreshold={0.15}
        ListFooterComponent={(pageable?.currentPage ?? -2) < (pageable?.totalPages ?? 0) - 1 ? <SkeletonLoader /> : null}
        ListEmptyComponent={isFirstRender.current ? null : <NoData />}
        style={styles.flatList}
      />
    </View>
  );
}

type FilterBarProps = FilterStatusProps & FilterFieldsProps & { filterParams: TApproveOvertimeFormFilterParams };
const FilterBar = ({ onStatusTabPress, filterParams, onFilterFieldsChange }: FilterBarProps) => {
  return (
    <View style={styles.filterBarContainer}>
      {/* Filter Status */}
      <ScrollView horizontal>
        <FilterStatus status={filterParams.status} onStatusTabPress={onStatusTabPress} />
      </ScrollView>
      {/* Filter Fields Button */}
      <FilterFields filterParams={filterParams} onFilterFieldsChange={onFilterFieldsChange} />
    </View>
  );
};

type FilterStatusProps = {
  onStatusTabPress: (newStatus: FORM_STATUS | null | undefined) => void;
  status?: FORM_STATUS | null;
};
const FilterStatus = ({ onStatusTabPress, status }: FilterStatusProps) => {
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
    </View>
  );
};
type FilterFieldsProps = FilterFieldsFormProps;
const FilterFields = ({ onFilterFieldsChange, filterParams }: FilterFieldsProps) => {
  const [open, setOpen] = useState(false);

  const onClose = () => setOpen(false);
  const onOpen = () => setOpen(true);

  const filterFieldsExcludeStatus = omitProperties(filterParams, ["status"]);
  const filterFieldsExcludeStatusAndNullishValue = omitNullishValues(filterFieldsExcludeStatus);
  const hasFilterExcludeStatus = Object.keys(filterFieldsExcludeStatusAndNullishValue).length > 0;

  return (
    <>
      {/* Filter Fields Button */}
      <TouchableOpacity onPress={onOpen}>
        <View style={styles.filterIconWrapper}>
          <Ionicons name="filter" size={24} color="black" />
          {hasFilterExcludeStatus && <View style={styles.filterBadge} />}
        </View>
      </TouchableOpacity>
      {/* Filter Fields Modal */}
      {open && (
        <MyFilterModal onClose={onClose} title="Bộ lọc" modalContainerStyles={{ height: 300 }}>
          <FilterFieldsForm filterParams={filterParams} onFilterFieldsChange={onFilterFieldsChange} />
        </MyFilterModal>
      )}
    </>
  );
};

type FilterFieldsFormProps = {
  onFilterFieldsChange: (newFilterParamsWihoutStatus: Omit<TApproveOvertimeFormFilterParams, "status">) => void;
  filterParams: TApproveOvertimeFormFilterParams;
};
const FilterFieldsForm = ({ onFilterFieldsChange, filterParams }: FilterFieldsFormProps) => {
  const { control, handleSubmit, reset, setValue } = useForm<TApproveOvertimeFormFilterParams>({});

  const onFieldsReset = () => {
    reset();
    onFilterFieldsChange({});
  };

  const onFilterApply = (values: TApproveOvertimeFormFilterParams) => {
    onFilterFieldsChange(values);
  };

  useEffect(() => {
    setValue("createdAt", filterParams.createdAt);
  }, [filterParams]);

  return (
    <View style={styles.modalContent}>
      <View style={styles.modalFields}>
        <FormPickDate useControllerProps={{ control: control, name: "createdAt" }} label="Ngày tạo đơn:" placeholder="Chọn ngày" />
      </View>

      <View style={styles.buttonModalContainer}>
        <TouchableOpacity onPress={onFieldsReset} activeOpacity={0.8} style={styles.buttonItem}>
          <View style={styles.buttonOutlined}>
            <NunitoText type="body3" style={{ color: "#0B3A82" }}>
              Đặt lại
            </NunitoText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSubmit(onFilterApply)} activeOpacity={0.8} style={styles.buttonItem}>
          <View style={styles.buttonContained}>
            <NunitoText type="body3" style={{ color: "white" }}>
              Áp dụng
            </NunitoText>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type ItemProps = {
  overtimeForm: TApproveOvertimeForm;
};
const Item: React.FC<ItemProps> = ({ overtimeForm }) => {
  const [isExpand, setIsExpand] = useState(false);
  const router = useRouter();

  const onGoToFormDetail = () => {
    router.navigate({
      pathname: "/approve-forms/overtime_forms/[id]",
      params: { id: overtimeForm.id },
    });
  };

  const onToggleExpand = () => setIsExpand(!isExpand);

  return (
    <View style={styles.itemBox}>
      {/* sumary */}
      <Pressable onPress={onGoToFormDetail}>
        <View style={styles.itemBoxSumary}>
          <View style={styles.userInfo}>
            <AvatarByRole role={overtimeForm.userRole.code} />
            <View style={{ gap: 4 }}>
              <NunitoText type="body3">{overtimeForm.userName}</NunitoText>
              <NunitoText type="body4" style={{ opacity: 0.75 }}>
                {overtimeForm.userRole.name}
              </NunitoText>
            </View>
          </View>
          <View style={styles.formInfo}>
            <ChipStatus status={overtimeForm.status} />
            <View>
              <View>
                <NunitoText type="body4" style={{ opacity: 0.675 }}>
                  {moment(overtimeForm.date).format("DD/MM/YYYY")}
                </NunitoText>
                <NunitoText type="body4" style={{ opacity: 0.675 }}>
                  {`${overtimeForm.startTime} - ${overtimeForm.endTime}`}
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
            <NunitoText type="body2">Loại ngoài giờ: </NunitoText>
            {`${overtimeForm.salaryCoefficientName} (x${overtimeForm.salaryCoefficient.toFixed(2)})`}
          </NunitoText>

          <NunitoText type="body4">
            <NunitoText type="body2">Ghi chú: </NunitoText>
            {overtimeForm.note}
          </NunitoText>

          {overtimeForm.approveDate && (
            <NunitoText type="body4">
              <NunitoText type="body2">Phê duyệt lúc: </NunitoText>
              {moment(overtimeForm.approveDate).format("DD/MM/YYYY HH:mm")}
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
  filterIconWrapper: {
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,

    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C84851",
  },
  //
  flatList: {
    paddingTop: 16,
  },
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

  modalContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  modalFields: {},
  buttonModalContainer: {
    flexDirection: "row",
    gap: 6,
  },
  buttonItem: {
    flexGrow: 1,
  },
  buttonContained: {
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    backgroundColor: "#0B3A82",
    borderRadius: 4,
  },
  buttonOutlined: {
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    borderColor: "#0B3A82",
    borderWidth: 1,
    borderRadius: 4,
  },
});
