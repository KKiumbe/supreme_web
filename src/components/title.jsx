import React from "react";
import { Typography, Box } from "@mui/material";
import { getTheme } from "../store/theme";

const TitleComponent = ({ title }) => {
  const theme = getTheme();

  return (
    <Box
      sx={{
        width: "100vw",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw",
        borderBottom: "2px solid #ddd",
        mb: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: "1300px",
          mx: "auto",
          py: 2,
          // Use proportional padding (responsive)
          pl: { xs: "5%", sm: "8%", md: "12%", lg: "15%" },
          pr: { xs: "3%", sm: "6%", md: "10%" },
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            fontSize: { xs: "1.5rem", sm: "1.8rem" },
            color: theme.palette.primary.contrastText,
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
};

export default TitleComponent;
