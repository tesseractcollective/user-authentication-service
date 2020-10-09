import React, { useState } from "react";
import {
  Create,
  List,
  Datagrid,
  DateField,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  TopToolbar,
  useRefresh,
} from "react-admin";
import AddIcon from "@material-ui/icons/Add";
import Button from "@material-ui/core/Button";
import Drawer from "@material-ui/core/Drawer";
import Typography from "@material-ui/core/Typography";

export const UserIdentitiesList = (props: any) => {
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const onCreateCancel = () => {
    setShowCreate(false);
  };
  const onEditCancel = () => {
    setEditItem(null);
  };

  const onRowClick = (id: string, basePath: string, record: any) => {
    setEditItem({ id, basePath, record });
  };

  const overrides = {
    basePath: "/identity",
    resource: "identity",
    hasList: true,
    hasEdit: false,
    hasShow: true,
    hasCreate: false,
  };

  const userId = props.record?.id;

  const Actions = () => (
    <TopToolbar>
      <Button color="primary" onClick={() => setShowCreate(true)}>
        <AddIcon />
        <Typography>Add</Typography>
      </Button>
    </TopToolbar>
  );

  return (
    <>
      <List {...props} {...overrides} filter={{ userId }} actions={<Actions />}>
        <Datagrid onClick={() => onRowClick}>
          <ReferenceField
            label="Provider"
            source="identityTypeId"
            reference="identityType"
          >
            <TextField source="name" />
          </ReferenceField>
          <DateField source="createdAt" />
          <DateField source="updatedAt" />
        </Datagrid>
      </List>

      <Drawer open={showCreate} anchor="right" onClose={onCreateCancel}>
        <UserIdentitiesCreate
          {...props}
          onCancel={onCreateCancel}
          userId={userId}
        />
      </Drawer>
    </>
  );
};

export const UserIdentitiesCreate = (props: any) => {
  const { userId, record, onCancel, ...rest } = props;
  const refresh = useRefresh();
  const overrides = {
    basePath: "/identity",
    resource: "identity",
    onSuccess: () => {
      refresh();
      onCancel();
    },
  };

  return (
    <Create {...rest} {...overrides}>
      <SimpleForm>
        <ReferenceInput
          disabled
          label="User"
          source="userId"
          reference="user"
          initialValue={userId}
        >
          <SelectInput />
        </ReferenceInput>
        <ReferenceInput
          label="Identity"
          source="identityTypeId"
          reference="identityType"
        >
          <SelectInput />
        </ReferenceInput>
        <TextInput label="Json data" source="data" />
      </SimpleForm>
    </Create>
  );
};
