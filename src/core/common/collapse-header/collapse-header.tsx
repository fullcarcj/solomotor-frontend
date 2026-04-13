import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Link from "next/link";

const CollapseHeader = () => {
  // const dispatch = useDispatch();
  // const headerCollapse = useSelector((state: any) => state.themeSetting.headerCollapse);

  // const toggleHeaderCollapse = () => {
  //   dispatch(setHeaderCollapse(!headerCollapse));
    
  // };

  return (
    <>
        
      
      <OverlayTrigger
        placement="bottom"
        overlay={<Tooltip id="collapse-tooltip">Collapse</Tooltip>}
      >
        <Link href="#" id="collapse-header" className={'active'} >
          <i className="ti ti-chevrons-up" />
        </Link>
        
      </OverlayTrigger>
    </>
  );
};

export default CollapseHeader;
